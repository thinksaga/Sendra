
import { Module } from '@nestjs/common';
import { CampaignLeadsController } from './campaign-leads.controller';
import { CampaignLeadsService } from './campaign-leads.service';

@Module({
    controllers: [CampaignLeadsController],
    providers: [CampaignLeadsService],
})
export class CampaignLeadsModule { }
