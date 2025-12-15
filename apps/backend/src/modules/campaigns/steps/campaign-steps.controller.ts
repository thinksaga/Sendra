
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CampaignStepsService, CreateStepDto, UpdateStepDto } from './campaign-steps.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../auth/guards/workspace.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { WorkspaceRole, WorkspaceContext } from '../../../../../../packages/types/src/auth/workspace-context';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';

@Controller('campaigns/:campaignId/steps')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class CampaignStepsController {
    constructor(private stepsService: CampaignStepsService) { }

    @Post()
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    create(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Body() body: CreateStepDto
    ) {
        return this.stepsService.addStep(ws.workspaceId, campaignId, body);
    }

    @Get()
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER, WorkspaceRole.READ_ONLY)
    findAll(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string
    ) {
        return this.stepsService.getSteps(ws.workspaceId, campaignId);
    }

    @Put('reorder')
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    reorder(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Body('stepIds') stepIds: string[]
    ) {
        return this.stepsService.reorderSteps(ws.workspaceId, campaignId, stepIds);
    }

    @Put(':stepId')
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    update(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Param('stepId', new ParseUUIDPipe()) stepId: string,
        @Body() body: UpdateStepDto
    ) {
        return this.stepsService.updateStep(ws.workspaceId, campaignId, stepId, body);
    }

    @Delete(':stepId')
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    remove(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
        @Param('stepId', new ParseUUIDPipe()) stepId: string
    ) {
        return this.stepsService.deleteStep(ws.workspaceId, campaignId, stepId);
    }
}
