
import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { CampaignLeadsService } from './campaign-leads.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../auth/guards/workspace.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { WorkspaceRole, WorkspaceContext } from '../../../../../../packages/types/src/auth/workspace-context';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';

@Controller('campaigns/:campaignId/leads')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class CampaignLeadsController {
    constructor(private leadsService: CampaignLeadsService) { }

    @Post()
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    async addLeads(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Body('leadIds') leadIds: string[]
    ) {
        return this.leadsService.addLeadsToCampaign(ws.workspaceId, campaignId, leadIds);
    }

    @Get()
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER, WorkspaceRole.READ_ONLY)
    async listLeads(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 50
    ) {
        return this.leadsService.getCampaignLeads(ws.workspaceId, campaignId, Number(page), Number(limit));
    }

    @Delete(':leadId')
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    async removeLead(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Param('leadId', new ParseUUIDPipe()) leadId: string
    ) {
        return this.leadsService.removeLeadFromCampaign(ws.workspaceId, campaignId, leadId);
    }
}
