
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditAction, AuditActorType } from '../audit/audit.service';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignsService {
    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
    ) { }

    async create(userId: string, workspaceId: string, name: string) {
        const campaign = await this.prisma.campaign.create({
            data: {
                workspaceId,
                name,
                status: CampaignStatus.DRAFT,
            },
        });

        // Audit Log
        this.audit.log({
            workspaceId,
            actorUserId: userId,
            actorType: AuditActorType.USER,
            action: AuditAction.CREATE,
            entityType: 'CAMPAIGN',
            entityId: campaign.id,
            metadata: { name: campaign.name }
        });

        return campaign;
    }
}
