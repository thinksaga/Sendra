
import { Controller, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';

@Controller('ai')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class AIController {
    constructor(private aiService: AIService) { }

    @Post('review/:campaignId')
    async reviewCampaign(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string
    ) {
        return this.aiService.reviewCampaign(ws.workspaceId, campaignId);
    }

    @Post('draft/:threadId')
    async draftReply(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('threadId', new ParseUUIDPipe()) threadId: string,
        @Body('tone') tone: 'neutral' | 'friendly' | 'direct' = 'neutral'
    ) {
        return this.aiService.draftReply(ws.workspaceId, threadId, tone);
    }
}
