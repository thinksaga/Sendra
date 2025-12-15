
import { Controller, Get, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';

@Controller('billing')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class BillingController {
    constructor(private billingService: BillingService) { }

    @Get('usage')
    async getUsage(@CurrentWorkspace() ws: WorkspaceContext) {
        return this.billingService.getPlanAndUsage(ws.workspaceId);
    }
}
