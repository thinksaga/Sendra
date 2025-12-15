
import { Module } from '@nestjs/common';

import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [InboxController],
    providers: [InboxService],
})
export class InboxModule { }
