
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import * as Joi from 'joi'; // Import Joi
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EmailAccountsModule } from './modules/email-accounts/email-accounts.module';
import { CampaignStepsModule } from './modules/campaigns/steps/campaign-steps.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { AIModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { AuditModule } from './modules/audit/audit.module';
import { ApiModule } from './modules/api/api.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                DATABASE_URL: Joi.string().required(),
                DIRECT_URL: Joi.string().required(),
                JWT_SECRET: Joi.string().required(), // If using custom JWT
                // KEYCLOAK VARS
                KEYCLOAK_ISSUER: Joi.string().required(),
                KEYCLOAK_CLIENT_ID: Joi.string().required(),
                // AI
                GEMINI_API_KEY: Joi.string().required(),
                // APP
                PORT: Joi.number().default(3000),
                FRONTEND_URL: Joi.string().default('http://localhost:3000'),
            }),
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST'),
                    port: Number(configService.get('REDIS_PORT')),
                },
            }),
            inject: [ConfigService],
        }),
        PrismaModule,
        AuthModule,
        InvitesModule,
        EmailAccountsModule,
        CampaignStepsModule,
        CampaignsModule,
        InboxModule,
        AIModule,
        AnalyticsModule,
        BillingModule,
        AuditModule,
        ApiModule,
        WorkspacesModule,
        NotificationsModule,
    ],
})
export class AppModule { }
