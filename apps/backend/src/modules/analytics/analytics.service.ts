
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private prisma: PrismaService) { }

    // 1. Track Event (Upsert Daily Metrics)
    async trackEvent(
        workspaceId: string,
        params: {
            campaignId?: string,
            emailAccountId?: string,
            type: 'SENT' | 'REPLY' | 'BOUNCE' | 'ERROR'
        }
    ) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            await this.prisma.$transaction(async (tx) => {
                // Workspace Metrics
                await tx.workspaceMetrics.upsert({
                    where: { workspaceId_date: { workspaceId, date: today } },
                    create: {
                        workspaceId,
                        date: today,
                        sentCount: params.type === 'SENT' ? 1 : 0,
                        replyCount: params.type === 'REPLY' ? 1 : 0,
                    },
                    update: {
                        sentCount: params.type === 'SENT' ? { increment: 1 } : undefined,
                        replyCount: params.type === 'REPLY' ? { increment: 1 } : undefined,
                    }
                });

                // Campaign Metrics
                if (params.campaignId) {
                    await tx.campaignMetrics.upsert({
                        where: { campaignId_date: { campaignId: params.campaignId, date: today } },
                        create: {
                            campaignId: params.campaignId,
                            date: today,
                            sentCount: params.type === 'SENT' ? 1 : 0,
                            replyCount: params.type === 'REPLY' ? 1 : 0,
                            bounceCount: params.type === 'BOUNCE' ? 1 : 0,
                            errorCount: params.type === 'ERROR' ? 1 : 0,
                        },
                        update: {
                            sentCount: params.type === 'SENT' ? { increment: 1 } : undefined,
                            replyCount: params.type === 'REPLY' ? { increment: 1 } : undefined,
                            bounceCount: params.type === 'BOUNCE' ? { increment: 1 } : undefined,
                            errorCount: params.type === 'ERROR' ? { increment: 1 } : undefined,
                        }
                    });
                }

                // Email Account Metrics
                if (params.emailAccountId) {
                    await tx.emailAccountMetrics.upsert({
                        where: { emailAccountId_date: { emailAccountId: params.emailAccountId, date: today } },
                        create: {
                            emailAccountId: params.emailAccountId,
                            date: today,
                            sentCount: params.type === 'SENT' ? 1 : 0,
                            replyCount: params.type === 'REPLY' ? 1 : 0,
                            bounceCount: params.type === 'BOUNCE' ? 1 : 0,
                        },
                        update: {
                            sentCount: params.type === 'SENT' ? { increment: 1 } : undefined,
                            replyCount: params.type === 'REPLY' ? { increment: 1 } : undefined,
                            bounceCount: params.type === 'BOUNCE' ? { increment: 1 } : undefined,
                        }
                    });
                }
            });
        } catch (error) {
            this.logger.error(`Failed to track metrics: ${error.message}`);
        }
    }

    // 2. Get Campaign Stats
    async getCampaignStats(workspaceId: string, campaignId: string, startDate: Date, endDate: Date) {
        // Validate ownership
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign || campaign.workspaceId !== workspaceId) throw new Error('Not found');

        const metrics = await this.prisma.campaignMetrics.findMany({
            where: {
                campaignId,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'asc' }
        });

        // Aggregates
        const total = metrics.reduce((acc, curr) => ({
            sent: acc.sent + curr.sentCount,
            replies: acc.replies + curr.replyCount,
            bounces: acc.bounces + curr.bounceCount,
            errors: acc.errors + curr.errorCount
        }), { sent: 0, replies: 0, bounces: 0, errors: 0 });

        return { total, daily: metrics };
    }

    // 3. Get Workspace Overview
    async getWorkspaceStats(workspaceId: string, startDate: Date, endDate: Date) {
        const metrics = await this.prisma.workspaceMetrics.findMany({
            where: {
                workspaceId,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'asc' }
        });

        const total = metrics.reduce((acc, curr) => ({
            sent: acc.sent + curr.sentCount,
            replies: acc.replies + curr.replyCount
        }), { sent: 0, replies: 0 });

        return { total, daily: metrics };
    }
}
