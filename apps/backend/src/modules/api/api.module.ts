
import { Module, Global } from '@nestjs/common';
import { WebhookService } from '../webhook/webhook.service';
import { PublicApiController } from './public-api.controller';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Global()
@Module({
    imports: [CampaignsModule],
    controllers: [PublicApiController],
    providers: [WebhookService, ApiKeyGuard],
    exports: [WebhookService],
})
export class ApiModule { }
