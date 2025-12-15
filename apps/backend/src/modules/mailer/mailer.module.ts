
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerService } from './mailer.service';
import { MailerProcessor } from './mailer.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SEND_EMAIL_QUEUE } from '../../../../../packages/types/src/events/email-job';

@Module({
    imports: [
        ConfigModule,
        BullModule.registerQueueAsync({
            name: SEND_EMAIL_QUEUE,
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                connection: {
                    host: config.get('REDIS_HOST') || 'localhost',
                    port: Number(config.get('REDIS_PORT')) || 6379,
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailerService, MailerProcessor],
    exports: [MailerService, BullModule],
})
export class MailerModule { }
