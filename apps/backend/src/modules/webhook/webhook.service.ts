
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEvent } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private prisma: PrismaService) { }

    async triggerWebhook(workspaceId: string, event: WebhookEvent, payload: any) {
        // Find listening endpoints
        const endpoints = await this.prisma.webhookEndpoint.findMany({
            where: {
                workspaceId,
                active: true,
                events: { has: event }
            }
        });

        if (endpoints.length === 0) return;

        // Dispatch (Fire & Forget, or Queue)
        for (const endpoint of endpoints) {
            this.sendPayload(endpoint, event, payload).catch(err =>
                this.logger.error(`Webhook fail ${endpoint.url}: ${err.message}`)
            );
        }
    }

    private async sendPayload(endpoint: any, event: WebhookEvent, payload: any) {
        const timestamp = Date.now();
        const signature = this.signPayload(payload, endpoint.secret, timestamp);

        // Native Fetch (Node 18+)
        await fetch(endpoint.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Sendra-Event': event,
                'X-Sendra-Signature': signature,
                'X-Sendra-Timestamp': timestamp.toString(),
            },
            body: JSON.stringify(payload)
        });
    }

    private signPayload(payload: any, secret: string, timestamp: number): string {
        const data = `${timestamp}.${JSON.stringify(payload)}`;
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }
}
