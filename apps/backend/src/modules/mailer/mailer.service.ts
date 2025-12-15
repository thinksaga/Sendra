
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { decrypt } from '../../common/utils/encryption';
import { PrismaService } from '../prisma/prisma.service';
import { EmailAccount } from '@prisma/client';

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    // Helper to create OAuth2 Client
    private getOAuthClient(accessToken: string, refreshToken: string) {
        const client = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET'),
        );

        client.setCredentials({
            access_token: decrypt(accessToken),
            refresh_token: decrypt(refreshToken),
        });

        return client;
    }

    // Check Daily Limit (Simple Redis/DB check would be better, here we query DB logs for V1 safe)
    // For V1, we will assume a simple check against 'lastSentAt' and strict hourly rate, 
    // but simpler: Just return true if account is ACTIVE. 
    // Real rate limiting requires Redis counters. We'll implement a stub for "Safe V1".
    async checkRateLimit(emailAccountId: string): Promise<boolean> {
        // TODO: Implement Redis sliding window. 
        // For now, checks are done in Worker via random jitter.
        return true;
    }

    // Send Email
    async sendEmail(
        emailAccount: EmailAccount,
        to: string,
        subject: string,
        body: string // Plain text only for V1
    ) {
        try {
            const auth = this.getOAuthClient(emailAccount.accessToken, emailAccount.refreshToken);
            const gmail = google.gmail({ version: 'v1', auth });

            // Construct Raw Email
            // Note: Minimal construction. No attachments/HTML yet.
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
            const messageParts = [
                `From: ${emailAccount.email}`,
                `To: ${to}`,
                `Subject: ${utf8Subject}`,
                `Content-Type: text/plain; charset=utf-8`,
                `MIME-Version: 1.0`,
                ``,
                body,
            ];
            const message = messageParts.join('\n');
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const res = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                },
            });

            this.logger.log(`Email sent to ${to} from ${emailAccount.email}. ID: ${res.data.id}`);
            return res.data;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            throw error; // Let BullMQ handle retry
        }
    }
}
