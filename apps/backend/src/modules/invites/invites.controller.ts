
import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { WorkspaceRole, WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../../../../packages/types/src/auth/user-context';

@Controller('invites') // Global invite acceptance route could be here or separate
export class InvitesController {
    constructor(private invitesService: InvitesService) { }

    // --- Workspace Scoped Routes (Creation/Listing) ---

    @Post(':workspaceId')
    @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    async createInvite(
        @CurrentWorkspace() ws: WorkspaceContext,
        @CurrentUser() user: UserContext,
        @Body('email') email: string,
        @Body('role') role: WorkspaceRole,
    ) {
        const invite = await this.invitesService.createInvite(ws.workspaceId, user.id, email, role);
        // STUB: SendEmail(invite.email, invite.token);
        return { message: 'Invite created', token: invite.token, inviteId: invite.id };
    }

    @Get(':workspaceId')
    @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    async listInvites(@CurrentWorkspace() ws: WorkspaceContext) {
        return this.invitesService.getPendingInvites(ws.workspaceId);
    }

    @Delete(':workspaceId/:inviteId')
    @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    async revokeInvite(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('inviteId') inviteId: string
    ) {
        await this.invitesService.revokeInvite(ws.workspaceId, inviteId);
        return { message: 'Invite revoked' };
    }

    // --- Public / User Acceptance Route ---

    @Post('accept/:token')
    @UseGuards(JwtAuthGuard) // User must be logged in to accept
    async acceptInvite(
        @Param('token') token: string,
        @CurrentUser() user: UserContext
    ) {
        await this.invitesService.acceptInvite(token, user.id);
        return { message: 'Invite accepted', workspaceId: '?' };
        // Ideally retrieve workspaceId from service return to redirect user 
    }
}
