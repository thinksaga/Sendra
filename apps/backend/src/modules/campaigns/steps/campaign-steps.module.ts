
import { Module } from '@nestjs/common';
import { CampaignStepsController } from './campaign-steps.controller';
import { CampaignStepsService } from './campaign-steps.service';

@Module({
    controllers: [CampaignStepsController],
    providers: [CampaignStepsService],
})
export class CampaignStepsModule { }
