import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from '../analytics/analytics.service';
import { google } from 'googleapis';
import { decrypt } from '../../common/utils/encryption';
import { EmailAccountStatus, CampaignLeadStatus, LeadStatus } from '@prisma/client';

import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvent } from '@prisma/client';

@Injectable()
export class InboxService {
    private readonly logger = new Logger(InboxService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private analytics: AnalyticsService,
        private webhook: WebhookService,
    ) { }

    // Helper to create OAuth2 Client
    private getOAuthClient(accessToken: string, refreshToken: string) {
        const client = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET'),
        );

        client.setCredentials({
            access_token: decrypt(accessToken),
            refresh_token: decrypt(refreshToken),
        });

        return client;
    }

    // 1. Poll Inbox for New Messages
    async pollInbox(emailAccountId: string) {
        const account = await this.prisma.emailAccount.findUnique({
            where: { id: emailAccountId },
        });

        if (!account || account.status !== EmailAccountStatus.ACTIVE) return;

        try {
            const auth = this.getOAuthClient(account.accessToken, account.refreshToken);
            const gmail = google.gmail({ version: 'v1', auth });

            // Fetch list of messages (simple, naive polling for V1)
            // Ideally use historyId or 'q' parameter with timestamp
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10,
                q: 'is:unread category:primary', // Only check unread primary for simplicity
            });

            const messages = res.data.messages || [];

            for (const msg of messages) {
                // Check if already processed
                const existing = await this.prisma.emailMessage.findUnique({
                    where: { externalId: msg.id }
                });
                if (existing) continue;

                // Fetch details
                const fullMsg = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full',
                });

                await this.ingestMessage(account.workspaceId, account.id, fullMsg.data);
            }
        } catch (error) {
            this.logger.error(`Polling failed for ${account.email}: ${error.message} `);
        }
    }

    // 2. Ingest & Process Message
    async ingestMessage(workspaceId: string, emailAccountId: string, msgData: any) {
        const headers = msgData.payload.headers;
        const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h) => h.name === 'From')?.value || '';
        const to = headers.find((h) => h.name === 'To')?.value || '';
        const messageId = headers.find((h) => h.name === 'Message-Id')?.value || '';
        const threadId = msgData.threadId;

        // Extract clean email from "From" (e.g. "Name <email@com>" -> "email@com")
        const fromEmail = from.match(/<(.+)>/)?.[1] || from;

        // Basic Body extraction (Plain text preferred)
        let body = msgData.snippet || ''; // Fallback
        // TODO: Recursive multipart parsing (omitted for brevity, assume snippet/simple for V1)

        // Find or Create Thread
        // Logic: Try to find by Gmail Thread ID first, else create.
        // We need to link this thread to a CampaignLead if possible.

        // 3. Match Logic
        // Find CampaignLead where lead.email == fromEmail && status == ACTIVE/PENDING
        const campaignLead = await this.prisma.campaignLead.findFirst({
            where: {
                lead: { email: fromEmail, workspaceId },
                status: { in: [CampaignLeadStatus.ACTIVE, CampaignLeadStatus.PENDING] }
            },
            include: { lead: true }
        });

        // Transaction handling
        await this.prisma.$transaction(async (tx) => {
            // Find existing internal thread or create
            let thread = await tx.emailThread.findFirst({
                where: { messages: { some: { threadId: threadId } } }
            });

            // If not found by ID, maybe by CampaignLead?
            // For V1, simplest is rely on Gmail ThreadId grouping logic if we sync history. 
            // Here we might just create a new thread entry for the Gmail Thread ID concept.
            // But wait, our schema has internal ID. Let's create a new Thread if no message from this Gmail threadId exists.

            // Actually, schema.prisma defined EmailMessage.threadId as relation to EmailThread.id.
            // We need to map Gmail Thread ID to our EmailThread.
            // We can store externalThreadId on EmailThread (schema update needed? or just deduce).
            // Let's assume for V1 we create a new thread if no message with this gmail thread ID matches.

            if (!thread) {
                // Create Thread
                thread = await tx.emailThread.create({
                    data: {
                        subject,
                        snippet: body.substring(0, 100),
                        lastMessageAt: new Date(parseInt(msgData.internalDate)),
                        workspaceId,
                        campaignLeadId: campaignLead?.id, // Link if matched
                    }
                });
            } else {                     // Update Thread
                await tx.emailThread.update({
                    where: { id: thread.id },
                    data: {
                        lastMessageAt: new Date(parseInt(msgData.internalDate)),
                        snippet: body.substring(0, 100),
                        status: 'OPEN',   // Re-open on new message
                        isRead: false,    // Mark unread
                    }
                });
            }

            // Save Message
            await tx.emailMessage.create({
                data: {
                    externalId: msgData.id,
                    threadId: thread.id,
                    emailAccountId,
                    from,
                    to: [to],
                    subject,
                    body,
                    snippet: body.substring(0, 100),
                    receivedAt: new Date(parseInt(msgData.internalDate)),
                    isInbound: true, // Assuming polling INBOX
                }
            });

            // 4. STOP ON REPLY Logic
            if (campaignLead) {
                // Mark Replied
                await tx.lead.update({
                    where: { id: campaignLead.leadId },
                    data: { status: LeadStatus.REPLIED }
                });

                // Stop Sequence
                await tx.campaignLead.update({
                    where: { id: campaignLead.id },
                    data: { status: CampaignLeadStatus.STOPPED }
                });

                // Analytics Track
                // Note: We need emailAccountId and campaignId. 
                // We have `emailAccountId` from method arg. 
                // We have `campaignLead.campaignId`.
                await this.analytics.trackEvent(workspaceId, {
                    campaignId: campaignLead.campaignId,
                    emailAccountId: emailAccountId,
                    type: 'REPLY'
                });

                this.logger.log(`Stopped campaign for lead ${campaignLead.lead.email} due to reply.`);
            }
        });
    }

    // 3. List Threads (Enhanced)
    async getThreads(
        workspaceId: string,
        params: {
            page?: number,
            limit?: number,
            status?: string,
            campaignId?: string
        }
    ) {
        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        const whereClause: any = { workspaceId };

        // Status Filter
        if (params.status) {
            whereClause.status = params.status; // e.g. 'OPEN', 'INTERESTED'
        }

        // Campaign Filter (via CampaignLead)
        if (params.campaignId) {
            whereClause.campaignLead = { campaignId: params.campaignId };
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.emailThread.findMany({
                where: whereClause,
                include: {
                    messages: { orderBy: { receivedAt: 'desc' }, take: 1 }, // Snippet
                    campaignLead: { include: { lead: true, campaign: true } }
                },
                orderBy: { lastMessageAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.emailThread.count({ where: whereClause })
        ]);

        return { data, total, page, limit };
    }

    // 4. Get Thread Details
    async getThread(workspaceId: string, threadId: string) {
        const thread = await this.prisma.emailThread.findUnique({
            where: { id: threadId },
            include: {
                messages: { orderBy: { receivedAt: 'asc' } },
                campaignLead: { include: { lead: true, campaign: true } }
            }
        });

        if (!thread || thread.workspaceId !== workspaceId) return null;
        return thread;
    }

    // 5. Update Status
    async updateStatus(workspaceId: string, threadId: string, status: string) {
        // Verify ownership
        const thread = await this.prisma.emailThread.findUnique({ where: { id: threadId } });
        if (!thread || thread.workspaceId !== workspaceId) throw new Error('Not found');

        return this.prisma.emailThread.update({
            where: { id: threadId },
            data: { status: status as any } // Cast to enum
        });
    }

    // 6. Mark Read/Unread
    async markRead(workspaceId: string, threadId: string, isRead: boolean) {
        const thread = await this.prisma.emailThread.findUnique({ where: { id: threadId } });
        if (!thread || thread.workspaceId !== workspaceId) throw new Error('Not found');

        return this.prisma.emailThread.update({
            where: { id: threadId },
            data: { isRead }
        });
    }
}
