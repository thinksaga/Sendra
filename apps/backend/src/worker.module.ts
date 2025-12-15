
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MailerModule } from './modules/mailer/mailer.module';
// Import only worker-relevant modules (e.g. Mailer, AI)
// For now, we keep it minimal.

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        MailerModule,
    ],
})
export class WorkerModule { }
