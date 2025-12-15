
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobData, SEND_EMAIL_QUEUE } from '../../../../../packages/types/src/events/email-job';
import { CampaignLeadStatus, LeadStatus, EmailAccountStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service'; // Added import

import { BillingService } from '../billing/billing.service'; // Add import
import { UsageMetric } from '@prisma/client'; // Add import

@Processor(SEND_EMAIL_QUEUE)
export class MailerProcessor extends WorkerHost {
    private readonly logger = new Logger(MailerProcessor.name);

    constructor(
        private readonly mailerService: MailerService,
        private readonly prisma: PrismaService,
        private readonly analytics: AnalyticsService,
        private readonly billing: BillingService, // Inject Billing
    ) {
        super();
    }

    async process(job: Job<EmailJobData>) {
        const { campaignId, leadId, stepId, workspaceId } = job.data;
        this.logger.log(`Processing email for lead ${leadId} in campaign ${campaignId}`);

        // 0A. CHECK LIMITS
        const canSend = await this.billing.checkAndIncrement(workspaceId, UsageMetric.SENDS);
        if (!canSend) {
            throw new Error('Monthly send limit reached');
        }

        // 0B. RACE CONDITION CHECK (Hardening)
        // Ensure lead is still in Valid state. Reply might have happened 5ms ago.
        const freshLeadStatus = await this.prisma.campaignLead.findUnique({
            where: { campaignId_leadId: { campaignId, leadId } },
            select: { status: true }
        });

        if (!freshLeadStatus || freshLeadStatus.status !== 'PENDING' && freshLeadStatus.status !== 'ACTIVE') {
            this.logger.warn(`Skipping send for lead ${leadId}: Status is ${freshLeadStatus?.status}`);
            return; // EXIT GRACEFULLY
        }

        // random Jitter (1-5s) to prevent bursts
        await new Promise(r => setTimeout(r, Math.random() * 4000 + 1000));

        // 1. Fetch & Validate Context
        const campaignLead = await this.prisma.campaignLead.findUnique({
            where: { campaignId_leadId: { campaignId, leadId } },
            include: { lead: true }
        });

        if (!campaignLead || campaignLead.status !== CampaignLeadStatus.PENDING && campaignLead.status !== CampaignLeadStatus.ACTIVE) {
            this.logger.warn(`Skipping job: Lead ${leadId} is not ACTIVE/PENDING (Status: ${campaignLead?.status})`);
            return;
        }

        if (campaignLead.lead.status === LeadStatus.UNSUBSCRIBED || campaignLead.lead.status === LeadStatus.BOUNCED) {
            this.logger.warn(`Skipping job: Lead ${leadId} is ${campaignLead.lead.status}`);
            return;
        }

        const step = await this.prisma.campaignStep.findUnique({ where: { id: stepId } });
        if (!step) throw new Error('Step not found');

        // 2. Select Sending Account (Round Robin or Random Active for V1)
        const emailAccount = await this.prisma.emailAccount.findFirst({
            where: { workspaceId, status: EmailAccountStatus.ACTIVE },
        });

        if (!emailAccount) {
            throw new Error('No active email accounts found for workspace');
        }

        // 3. Render Content (Basic)
        let body = step.body || '';
        let subject = step.subject || '';

        // Simple replacement
        const variables = {
            firstName: campaignLead.lead.firstName || '',
            lastName: campaignLead.lead.lastName || '',
            company: campaignLead.lead.company || '',
            email: campaignLead.lead.email || ''
        };

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, value);
            subject = subject.replace(regex, value);
        }

        // 4. Send
        try {
            await this.mailerService.sendEmail(emailAccount, campaignLead.lead.email, subject, body);

            // 5. Update State
            await this.prisma.campaignLead.update({
                where: { id: campaignLead.id },
                data: {
                    status: CampaignLeadStatus.ACTIVE, // Ensure active
                    lastSentAt: new Date(),
                    currentStepOrder: step.stepOrder,
                }
            });

            // Check if next step exists? If not, mark COMPLETED? 
            // V1: Simple increment logic usually happens in a Scheduler. 
            // Here we just mark sent. 

        } catch (error) {
            this.logger.error(`Sending failed: ${error.message}`);
            // If auth error, maybe pause account?
            if (error.message.includes('invalid_grant')) {
                await this.prisma.emailAccount.update({
                    where: { id: emailAccount.id },
                    data: { status: EmailAccountStatus.ERROR }
                });
            }
            throw error; // Retry
        }
    }
}
