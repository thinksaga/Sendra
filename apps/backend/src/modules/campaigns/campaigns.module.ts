
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignStepsModule } from './steps/campaign-steps.module';
import { CampaignLeadsModule } from './leads/campaign-leads.module';
import { SEND_EMAIL_QUEUE } from '../../../../../packages/types/src/events/email-job';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
    imports: [
        ConfigModule,
        BullModule.registerQueue({
            name: SEND_EMAIL_QUEUE,
        }),
    ],
    controllers: [CampaignsController],
    providers: [CampaignsService, PrismaService, AuditService],
    exports: [CampaignsService],
})
export class CampaignsModule { }
