
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';

@Controller('inbox')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class InboxController {
    constructor(private inboxService: InboxService) { }

    @Get('threads')
    async listThreads(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
        @Query('status') status?: string,
        @Query('campaignId') campaignId?: string
    ) {
        return this.inboxService.getThreads(ws.workspaceId, { page: Number(page), limit: Number(limit), status, campaignId });
    }

    @Get('threads/:id')
    async getThread(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('id', new ParseUUIDPipe()) threadId: string
    ) {
        return this.inboxService.getThread(ws.workspaceId, threadId);
    }

    @Patch('threads/:id/status')
    async updateStatus(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('id', new ParseUUIDPipe()) threadId: string,
        @Body('status') status: string
    ) {
        // Validate status enum manually or via Pipe in future
        return this.inboxService.updateStatus(ws.workspaceId, threadId, status);
    }

    @Patch('threads/:id/read')
    async markRead(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('id', new ParseUUIDPipe()) threadId: string,
        @Body('isRead') isRead: boolean
    ) {
        return this.inboxService.markRead(ws.workspaceId, threadId, isRead);
    }

    // Trigger Poll Manually (for testing/demo)
    @Post('poll/:accountId')
    async poll(@Param('accountId') accountId: string) {
        await this.inboxService.pollInbox(accountId);
        return { message: 'Poll started' };
    }
}
