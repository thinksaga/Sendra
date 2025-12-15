
import { Controller, Post, Body, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { WorkspaceRole, WorkspaceContext } from '../../../../../packages/types/src/auth/workspace-context';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../../../../packages/types/src/auth/user-context';
import { SEND_EMAIL_QUEUE, EmailJobData } from '../../../../../packages/types/src/events/email-job';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class CampaignsController {
    constructor(
        @InjectQueue(SEND_EMAIL_QUEUE) private emailQueue: Queue,
        private prisma: PrismaService,
        private campaignsService: CampaignsService,
    ) { }

    @Post()
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MEMBER)
    async createCampaign(
        @CurrentWorkspace() ws: WorkspaceContext,
        @CurrentUser() user: UserContext,
        @Body('name') name: string
    ) {
        return this.campaignsService.create(user.id, ws.workspaceId, name);
    }

    @Post(':id/start')
    @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
    async startCampaign(
        @CurrentWorkspace() ws: WorkspaceContext,
        @Param('id', ParseUUIDPipe) campaignId: string
    ) {
        // Check Campaign first
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign || campaign.workspaceId !== ws.workspaceId) return { error: 'Not found' };

        // Get Steps
        const steps = await this.prisma.campaignStep.findMany({
            where: { campaignId },
            orderBy: { stepOrder: 'asc' }
        });
        if (steps.length === 0) return { message: 'No steps defined' };

        const firstStep = steps[0];

        // Find leads who haven't started (PENDING)
        const leadsToStart = await this.prisma.campaignLead.findMany({
            where: {
                campaignId,
                status: 'PENDING'
            }
        });

        // Enqueue
        const jobs = leadsToStart.map(lead => ({
            name: 'send-email',
            data: {
                workspaceId: ws.workspaceId,
                campaignId: campaignId,
                leadId: lead.leadId,
                stepId: firstStep.id
            }
        }));

        await this.emailQueue.addBulk(jobs);

        return { message: `Enqueued ${jobs.length} leads` };
    }
}
