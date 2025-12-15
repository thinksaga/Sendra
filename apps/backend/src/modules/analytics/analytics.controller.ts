
import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';

@Controller('analytics')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    @Get('workspace')
    async getWorkspaceStats(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = to ? new Date(to) : new Date();
        return this.analyticsService.getWorkspaceStats(ws.workspaceId, startDate, endDate);
    }

    @Get('campaign/:id')
    async getCampaignStats(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('id', new ParseUUIDPipe()) campaignId: string,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = to ? new Date(to) : new Date();
        return this.analyticsService.getCampaignStats(ws.workspaceId, campaignId, startDate, endDate);
    }
}
