
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string, workspaceId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        // Filter: either targeted to user, OR global to workspace (ignoring read status for global for now as it's singular)
        // Actually, let's just fetch targeted notifications for now to match schema intent of 'isRead'
        const where = {
            workspaceId,
            userId
        };

        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(skip)
            }),
            this.prisma.notification.count({ where })
        ]);

        const unreadCount = await this.prisma.notification.count({
            where: { ...where, isRead: false }
        });

        return { data, total, unreadCount };
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });
    }

    async markAllAsRead(userId: string, workspaceId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, workspaceId, isRead: false },
            data: { isRead: true }
        });
    }

    // Helper to create notification
    async create(data: {
        workspaceId: string,
        userId: string,
        title: string,
        message: string,
        type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
    }) {
        return this.prisma.notification.create({
            data: {
                ...data,
                type: data.type || 'INFO'
            }
        });
    }
}
