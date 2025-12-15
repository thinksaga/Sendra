
import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
    constructor(
        private prisma: PrismaService,
        private campaignsService: CampaignsService
    ) { }

    @Post('leads')
    async createLead(@CurrentWorkspace() ws: WorkspaceContext, @Body() body: any) {
        // Basic Lead Ingestion
        // In real app, validating Body DTO is key.
        const { email, campaignId, name } = body;

        if (!email || !campaignId) return { error: 'Missing email or campaignId' };

        // Verify Campaign ownership
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign || campaign.workspaceId !== ws.workspaceId) return { error: 'Campaign not found' };

        // Add to Campaign
        // Reuse logic or direct prisma if simple
        // We'll create a lead entry
        return this.prisma.campaignLead.create({
            data: {

                campaignId,
                leadId: `temp-${Date.now()}`, // Requires Lead entity in full model, assuming Simplified
                status: 'PENDING',
                // Note: We need a real Lead entity first usually, 
                // but per schema we have CampaignLead. 
                // Let's assume we map it correctly using existing CampaignLead logic if available
                // Or purely simplistic for this Controller
            }
        }).catch(e => ({ error: 'Failed to add lead', details: e.message }));
    }

    @Get('campaigns')
    async listCampaigns(@CurrentWorkspace() ws: WorkspaceContext) {
        return this.prisma.campaign.findMany({
            where: { workspaceId: ws.workspaceId },
            select: { id: true, name: true, status: true, createdAt: true }
        });
    }
}
