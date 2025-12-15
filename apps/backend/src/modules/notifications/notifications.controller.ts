
import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { UserContext } from '../../../../../packages/types/src/auth/user-context';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(
        @CurrentUser() user: UserContext,
        @CurrentWorkspace() ws: WorkspaceContext,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return this.notificationsService.findAll(user.id, ws.workspaceId, page, limit);
    }

    @Patch(':id/read')
    async markAsRead(
        @CurrentUser() user: UserContext,
        @Param('id') id: string
    ) {
        return this.notificationsService.markAsRead(id, user.id);
    }

    @Post('read-all')
    async markAllAsRead(
        @CurrentUser() user: UserContext,
        @CurrentWorkspace() ws: WorkspaceContext
    ) {
        return this.notificationsService.markAllAsRead(user.id, ws.workspaceId);
    }
}
