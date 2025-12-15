
import { Controller, Get, Post, Delete, Query, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmailAccountsService } from './email-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { WorkspaceRole, WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('email-accounts')
export class EmailAccountsController {
    constructor(private emailAccountsService: EmailAccountsService) { }

    // 1. Start Connect Flow (Returns URL to frontend)
    @Get('connect/gmail')
    @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    connectGmail(@CurrentWorkspace() ws: WorkspaceContext) {
        const url = this.emailAccountsService.getAuthUrl(ws.workspaceId);
        return { url };
    }

    // 2. OAuth Callback
    // NOTE: This usually comes from the browser redirect. 
    // Ideally, the Backend callback endpoint handles the code exchange and redirects to Frontend success/error page.
    @Get('callback/google')
    async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        // This endpoint is PUBLIC because Google calls it directly (or user redirects via browser with cookies).
        // We rely on 'state' to carry context securely (and ideally check CSRF if using session cookies, 
        // but here we are stateless API -> relies on validating the state payload).

        // In a strict API-only mode, Frontend might receive the code and POST it to us. 
        // But standard OAuth often has Backend handle the exchange. 
        // Let's assume Backend handles it and redirects to Frontend Dashboard.

        try {
            await this.emailAccountsService.handleCallback(code, state);
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?status=email_connected`);
        } catch (error) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?status=email_error&message=${encodeURIComponent(error.message)}`);
        }
    }

    // 3. List
    @Get()
    @UseGuards(JwtAuthGuard, WorkspaceGuard)
    listAccounts(@CurrentWorkspace() ws: WorkspaceContext) {
        return this.emailAccountsService.listAccounts(ws.workspaceId);
    }

    // 4. Disconnect
    @Delete(':id')
    @UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    disconnect(@CurrentWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
        return this.emailAccountsService.disconnectAccount(ws.workspaceId, id);
    }
}
