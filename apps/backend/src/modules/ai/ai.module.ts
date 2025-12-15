
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';

@Module({
    imports: [ConfigModule],
    controllers: [AIController],
    providers: [AIService],
})
export class AIModule { }
