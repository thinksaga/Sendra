
import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext, WorkspaceRole } from '../../../../../packages/types/src/auth/workspace-context';

@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class WorkspaceExampleController {

    @Get()
    @Roles(WorkspaceRole.MEMBER) // Requires at least MEMBER role
    getDashboard(@CurrentWorkspace() workspace: WorkspaceContext) {
        return {
            message: `Welcome to workspace ${workspace.workspaceId}`,
            role: workspace.role,
            accessLevel: 'MEMBER+',
        };
    }

    @Get('params')
    @Roles(WorkspaceRole.ADMIN) // Requires at least ADMIN
    getSettings(@CurrentWorkspace() workspace: WorkspaceContext) {
        return {
            message: 'Sensitive Settings Data',
            accessLevel: 'ADMIN+',
        };
    }
}
