
import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageMetric } from '@prisma/client';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(private prisma: PrismaService) { }

    // 1. Get Plan & Usage
    async getPlanAndUsage(workspaceId: string) {
        const workspacePlan = await this.prisma.workspacePlan.findUnique({
            where: { workspaceId },
            include: { plan: true }
        });

        const plan = workspacePlan?.plan || await this.getDefaultPlan();

        const period = this.getCurrentPeriod();
        const usage = await this.prisma.usageCounter.findMany({
            where: { workspaceId, period }
        });

        // Convert to easy access map
        const usageMap = usage.reduce((acc, curr) => ({ ...acc, [curr.metric]: curr.count }), {});

        return {
            plan,
            usage: {
                sends: usageMap[UsageMetric.SENDS] || 0,
                inboxes: usageMap[UsageMetric.INBOXES] || 0,
                aiRequests: usageMap[UsageMetric.AI_REQUESTS] || 0,
            }
        };
    }

    // 2. Check and Increment Usage (Atomic)
    async checkAndIncrement(workspaceId: string, metric: UsageMetric): Promise<boolean> {
        const { plan, usage } = await this.getPlanAndUsage(workspaceId);

        let limit = 0;
        let current = 0;

        switch (metric) {
            case UsageMetric.SENDS:
                limit = plan.monthlySends;
                current = usage.sends;
                break;
            case UsageMetric.INBOXES:
                limit = plan.inboxLimit;
                current = await this.prisma.emailAccount.count({ where: { workspaceId } }); // Always count actual
                break;
            case UsageMetric.AI_REQUESTS:
                limit = plan.aiLimit;
                current = usage.aiRequests;
                break;
        }

        if (current >= limit) {
            this.logger.warn(`Limit reached for ${metric} in workspace ${workspaceId}`);
            return false;
        }

        // Increment for counters (INBOXES is strictly count-based, SENDS/AI are additive)
        if (metric !== UsageMetric.INBOXES) {
            const period = this.getCurrentPeriod();
            await this.prisma.usageCounter.upsert({
                where: { workspaceId_metric_period: { workspaceId, metric, period } },
                create: { workspaceId, metric, period, count: 1 },
                update: { count: { increment: 1 } }
            });
        }

        return true;
    }

    // Checking Inboxes specifically (since it's state-based, not cumulative)
    async canAddInbox(workspaceId: string): Promise<boolean> {
        const { plan } = await this.getPlanAndUsage(workspaceId);
        const current = await this.prisma.emailAccount.count({ where: { workspaceId } });
        return current < plan.inboxLimit;
    }

    private async getDefaultPlan() {
        return this.prisma.plan.upsert({
            where: { name: 'FREE' },
            create: { name: 'FREE', monthlySends: 100, inboxLimit: 1, aiLimit: 10 },
            update: {}
        });
    }

    private getCurrentPeriod(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}
