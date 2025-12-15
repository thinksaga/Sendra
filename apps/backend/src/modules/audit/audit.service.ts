
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    PAUSE = 'PAUSE',
    RESUME = 'RESUME',
    IMPORT = 'IMPORT',
    EXPORT = 'EXPORT',
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',
}

export enum AuditActorType {
    USER = 'USER',
    SYSTEM = 'SYSTEM',
}

interface AuditLogParams {
    workspaceId: string;
    actorUserId?: string;
    actorType: AuditActorType;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    // Async, non-blocking write
    async log(params: AuditLogParams) {
        // Fire and forget to not block main thread, 
        // but catch errors to prevent unhandled rejection crashes if strict api
        this.writeLog(params).catch(err => {
            this.logger.error(`Failed to write audit log: ${err.message}`, err.stack);
        });
    }

    private async writeLog(params: AuditLogParams) {
        await this.prisma.auditLog.create({
            data: {
                workspaceId: params.workspaceId,
                actorUserId: params.actorUserId,
                actorType: params.actorType,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                metadata: params.metadata || {},
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            }
        });
    }

    async getLogs(workspaceId: string, filters: { entityType?: string, action?: string, from?: Date, to?: Date }) {
        return this.prisma.auditLog.findMany({
            where: {
                workspaceId,
                entityType: filters.entityType,
                action: filters.action,
                createdAt: {
                    gte: filters.from,
                    lte: filters.to
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to 100 for now
        });
    }
}
