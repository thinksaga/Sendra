
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignStepType } from '@prisma/client';

export type CreateStepDto = {
    type: CampaignStepType;
    subject?: string;
    body?: string;
    delayDays: number;
};

export type UpdateStepDto = Partial<CreateStepDto>;

@Injectable()
export class CampaignStepsService {
    constructor(private prisma: PrismaService) { }

    // 1. Add Step
    async addStep(workspaceId: string, campaignId: string, data: CreateStepDto) {
        // Verify Campaign exists & belongs to workspace
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign || campaign.workspaceId !== workspaceId) {
            throw new NotFoundException('Campaign not found');
        }

        // Determine next order
        const lastStep = await this.prisma.campaignStep.findFirst({
            where: { campaignId },
            orderBy: { stepOrder: 'desc' },
        });

        const stepOrder = lastStep ? lastStep.stepOrder + 1 : 1;

        // Validate delay
        if (data.delayDays < 0) {
            throw new BadRequestException('Delay days must be non-negative');
        }

        return this.prisma.campaignStep.create({
            data: {
                campaignId,
                stepOrder,
                type: data.type,
                subject: data.subject,
                body: data.body,
                delayDays: data.delayDays,
            },
        });
    }

    // 2. Get Steps
    async getSteps(workspaceId: string, campaignId: string) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign || campaign.workspaceId !== workspaceId) {
            throw new NotFoundException('Campaign not found');
        }

        return this.prisma.campaignStep.findMany({
            where: { campaignId },
            orderBy: { stepOrder: 'asc' },
        });
    }

    // 3. Update Step
    async updateStep(workspaceId: string, campaignId: string, stepId: string, data: UpdateStepDto) {
        // We must verify hierarchy: Step -> Campaign -> Workspace
        // This query ensures safety in one go
        const step = await this.prisma.campaignStep.findFirst({
            where: { id: stepId, campaignId },
            include: { campaign: true }
        });

        if (!step || step.campaign.workspaceId !== workspaceId) {
            throw new NotFoundException('Step not found');
        }

        if (data.delayDays !== undefined && data.delayDays < 0) {
            throw new BadRequestException('Delay days must be non-negative');
        }

        return this.prisma.campaignStep.update({
            where: { id: stepId },
            data: {
                subject: data.subject,
                body: data.body,
                delayDays: data.delayDays,
                // Type usually shouldn't change, but we allow it if passed
                ...(data.type && { type: data.type })
            }
        });
    }

    // 4. Delete Step (and reorder subsequent)
    async deleteStep(workspaceId: string, campaignId: string, stepId: string) {
        const step = await this.prisma.campaignStep.findFirst({
            where: { id: stepId, campaignId },
            include: { campaign: true }
        });

        if (!step || step.campaign.workspaceId !== workspaceId) {
            throw new NotFoundException('Step not found');
        }

        // Transaction: Delete + Shift others down
        return this.prisma.$transaction(async (tx) => {
            await tx.campaignStep.delete({ where: { id: stepId } });

            // Decrement order for all steps > deleted stepOrder
            await tx.campaignStep.updateMany({
                where: {
                    campaignId,
                    stepOrder: { gt: step.stepOrder }
                },
                data: {
                    stepOrder: { decrement: 1 }
                }
            });
        });
    }

    // 5. Reorder Steps
    // Simplistic approach: specific step moves to new index. 
    // Real implementation of drag-drop reorder is complex. 
    // Here we assume client sends full array of IDs in intended order.
    async reorderSteps(workspaceId: string, campaignId: string, stepIds: string[]) {
        // Verify all steps belong to campaign
        const steps = await this.prisma.campaignStep.findMany({
            where: { campaignId },
            select: { id: true, campaign: { select: { workspaceId: true } } }
        });

        if (steps.length === 0) return;
        if (steps[0].campaign.workspaceId !== workspaceId) throw new NotFoundException('Campaign not found');

        if (steps.length !== stepIds.length) {
            throw new BadRequestException('Step count mismatch');
        }

        // Bulk update is tricky in Prisma. We loop. 
        // Since max steps is low (usually < 10 for cold email), this is fine.
        return this.prisma.$transaction(
            stepIds.map((id, index) =>
                this.prisma.campaignStep.update({
                    where: { id },
                    data: { stepOrder: index + 1 }
                })
            )
        );
    }
}
