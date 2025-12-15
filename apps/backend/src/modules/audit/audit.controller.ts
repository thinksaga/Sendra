
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.guard'; // Assuming decorator export
import { WorkspaceRole } from '../../../../../packages/types/src/auth/workspace-context';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';

@Controller('audit')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get()
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER) // Strict Access
    async getLogs(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Query('entityType') entityType?: string,
        @Query('action') action?: string,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        return this.auditService.getLogs(ws.workspaceId, {
            entityType,
            action,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined
        });
    }
}
