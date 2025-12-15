
import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { encrypt, decrypt } from '../../common/utils/encryption';
import { google } from 'googleapis'; // Assuming googleapis is installed

@Injectable()
export class EmailAccountsService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    private getOAuthClient() {
        return new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET'),
            this.configService.get('GOOGLE_CALLBACK_URL'), // e.g., http://localhost:3000/email-accounts/callback/google
        );
    }

    // 1. Generate Auth URL
    getAuthUrl(workspaceId: string) {
        const oauth2Client = this.getOAuthClient();

        // We encode workspaceId in 'state' to know where to attach the account later
        const state = JSON.stringify({ workspaceId });

        return oauth2Client.generateAuthUrl({
            access_type: 'offline', // Critical for refresh token
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                // Add other scopes as needed
            ],
            state,
            prompt: 'consent', // Force consent to ensure refresh token is returned
        });
    }

    // 2. Handle Callback
    async handleCallback(code: string, state: string) {
        let workspaceId: string;
        try {
            const decodedState = JSON.parse(state);
            workspaceId = decodedState.workspaceId;
        } catch (e) {
            throw new BadRequestException('Invalid state parameter');
        }

        const oauth2Client = this.getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new BadRequestException('No access token returned');
        }

        oauth2Client.setCredentials(tokens);

        // Fetch User Info to identify email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        if (!email) {
            throw new BadRequestException('Could not retrieve email address from provider');
        }

        // Encrypt Tokens
        const encryptedAccessToken = encrypt(tokens.access_token);
        const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

        // NOTE: If re-connecting, refresh token might not be sent unless 'prompt=consent'. 
        // We should handle update logic carefully.

        // Check strict uniqueness: One email per workspace
        const existing = await this.prisma.emailAccount.findUnique({
            where: {
                workspaceId_email: {
                    workspaceId,
                    email
                }
            }
        });

        if (existing) {
            // Update tokens
            return this.prisma.emailAccount.update({
                where: { id: existing.id },
                data: {
                    accessToken: encryptedAccessToken,
                    // Only update refresh token if we got a new one
                    ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
                    tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
                    status: 'ACTIVE'
                }
            });
        }

        if (!encryptedRefreshToken) {
            // First time connection MUST have refresh token. 
            // If missing, user likely revoked access or we didn't force consent.
            // For reliability, fail here or ask user to re-connect.
            throw new BadRequestException('No refresh token received. Please try again.');
        }

        return this.prisma.emailAccount.create({
            data: {
                workspaceId,
                email,
                provider: 'GMAIL',
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
                status: 'ACTIVE'
            }
        });
    }

    // 3. List Accounts
    async listAccounts(workspaceId: string) {
        return this.prisma.emailAccount.findMany({
            where: { workspaceId },
            select: {
                id: true,
                email: true,
                status: true,
                provider: true,
                createdAt: true,
                // Never return tokens
            }
        });
    }

    // 4. Disconnect
    async disconnectAccount(workspaceId: string, accountId: string) {
        const account = await this.prisma.emailAccount.findUnique({
            where: { id: accountId }
        });

        if (!account || account.workspaceId !== workspaceId) {
            throw new NotFoundException('Account not found');
        }

        return this.prisma.emailAccount.delete({
            where: { id: accountId }
        });
    }
}
