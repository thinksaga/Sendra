
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailAccountsController } from './email-accounts.controller';
import { EmailAccountsService } from './email-accounts.service';

@Module({
    imports: [ConfigModule],
    controllers: [EmailAccountsController],
    providers: [EmailAccountsService],
})
export class EmailAccountsModule { }
