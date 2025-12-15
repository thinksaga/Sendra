
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStatus, CampaignLeadStatus } from '@prisma/client';

@Injectable()
export class CampaignLeadsService {
    constructor(private prisma: PrismaService) { }

    // 1. Bulk Add Leads to Campaign
    async addLeadsToCampaign(workspaceId: string, campaignId: string, leadIds: string[]) {
        // Verify Campaign
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign || campaign.workspaceId !== workspaceId) {
            throw new NotFoundException('Campaign not found');
        }

        // Fetch Leads to check status and workspace ownership
        const leads = await this.prisma.lead.findMany({
            where: {
                id: { in: leadIds },
                workspaceId,
            },
        });

        if (leads.length === 0) {
            return { added: 0, suppressed: 0, errors: ['No valid leads found'] };
        }

        let addedCount = 0;
        let suppressedCount = 0;
        const errors: string[] = [];

        // Process each lead
        // Optimization: In production, we'd do bulk inserts/checks. For clarity/logic, we loop.
        for (const lead of leads) {
            // Suppression Rule 1: Global Status
            if (lead.status === LeadStatus.UNSUBSCRIBED || lead.status === LeadStatus.BOUNCED) {
                suppressedCount++;
                continue;
            }

            // Suppression Rule 2: Already in this campaign?
            // Prisma createMany with skipDuplicates is one way, but we want to track suppression.
            const existing = await this.prisma.campaignLead.findUnique({
                where: {
                    campaignId_leadId: {
                        campaignId,
                        leadId: lead.id
                    }
                }
            });

            if (existing) {
                // If stopped, maybe re-activate? limit scope for now.
                suppressedCount++;
                continue;
            }

            // Suppression Rule 3 (Configurable): Already active in another campaign?
            // CHECK: Is lead ACTIVE in ANY other campaign?
            const activeInOther = await this.prisma.campaignLead.findFirst({
                where: {
                    leadId: lead.id,
                    status: CampaignLeadStatus.ACTIVE,
                    campaignId: { not: campaignId }
                }
            });

            if (activeInOther) {
                suppressedCount++;
                // Log suppression reason?
                continue;
            }

            // Add to Campaign
            await this.prisma.campaignLead.create({
                data: {
                    campaignId,
                    leadId: lead.id,
                    status: CampaignLeadStatus.PENDING, // Starts pending
                }
            });
            addedCount++;
        }

        return { added: addedCount, suppressed: suppressedCount, errors };
    }

    // 2. Remove Lead (Stop)
    async removeLeadFromCampaign(workspaceId: string, campaignId: string, leadId: string) {
        const campaignLead = await this.prisma.campaignLead.findUnique({
            where: { campaignId_leadId: { campaignId, leadId } },
            include: { campaign: true }
        });

        if (!campaignLead || campaignLead.campaign.workspaceId !== workspaceId) {
            throw new NotFoundException('Lead not found in campaign');
        }

        // We don't delete, we mark STOPPED to keep history
        return this.prisma.campaignLead.update({
            where: { id: campaignLead.id },
            data: { status: CampaignLeadStatus.STOPPED }
        });
    }

    // 3. List Leads in Campaign
    async getCampaignLeads(workspaceId: string, campaignId: string, page = 1, limit = 50) {
        // Verify access
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign || campaign.workspaceId !== workspaceId) throw new NotFoundException('Campaign not found');

        const skip = (page - 1) * limit;

        const [data, total] = await this.prisma.$transaction([
            this.prisma.campaignLead.findMany({
                where: { campaignId },
                include: { lead: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.campaignLead.count({ where: { campaignId } })
        ]);

        return { data, total, page, limit };
    }
}
