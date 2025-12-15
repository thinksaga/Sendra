
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIRequestType } from '@prisma/client';

import { BillingService } from '../billing/billing.service';
import { UsageMetric } from '@prisma/client';

@Injectable()
export class AIService {
    private readonly logger = new Logger(AIService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private billing: BillingService,
    ) {
        this.apiKey = this.configService.get('GEMINI_API_KEY') || '';
        if (!this.apiKey) this.logger.warn('GEMINI_API_KEY is not set');
    }

    // ... callGemini method ...

    private async validateRateLimit(workspaceId: string) {
        const allowed = await this.billing.checkAndIncrement(workspaceId, UsageMetric.AI_REQUESTS);
        if (!allowed) {
            throw new BadRequestException('Monthly AI limit reached for this workspace.');
        }
    }

    private async callGemini(prompt: string): Promise<string> {
        if (!this.apiKey) throw new BadRequestException('AI is not configured');

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Gemini API Error: ${err}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            this.logger.error(`AI Call Failed: ${error.message}`);
            throw new BadRequestException('AI Service Temporarily Unavailable');
        }
    }



    // 1. Review Campaign
    async reviewCampaign(workspaceId: string, campaignId: string) {
        await this.validateRateLimit(workspaceId);

        // Fetch Campaign
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { steps: true }
        });
        if (!campaign || campaign.workspaceId !== workspaceId) throw new BadRequestException('Campaign not found');

        const context = campaign.steps.map(s => `Subject: ${s.subject}\nBody: ${s.body}`).join('\n---\n');

        const prompt = `
        You are an email deliverables expert. Review this cold email sequence for spam risks and effectiveness.
        
        Emails:
        ${context}
        
        Output purely valid JSON with no markdown formatting:
        {
            "spamScore": number (1-100, high means likely spam),
            "subjectScore": number (1-100, high is good),
            "contentScore": number (1-100, high is good),
            "suggestions": string[] (list of specific improvements)
        }
        `;

        const resultText = await this.callGemini(prompt);
        let resultJson;
        try {
            // Clean markdown code blocks if present
            const cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            resultJson = JSON.parse(cleanText);
        } catch (e) {
            throw new BadRequestException('Failed to parse AI response');
        }

        // Log Request
        await this.prisma.aIRequest.create({
            data: {
                workspaceId,
                type: AIRequestType.CAMPAIGN_REVIEW,
                modelUsed: 'gemini-pro',
                inputTokens: prompt.length / 4, // Rough est
                outputTokens: resultText.length / 4,
            }
        });

        // Store Review
        return this.prisma.aIReview.create({
            data: {
                campaignId,
                spamScore: resultJson.spamScore || 0,
                subjectScore: resultJson.subjectScore || 0,
                contentScore: resultJson.contentScore || 0,
                suggestions: resultJson.suggestions || [],
            }
        });
    }

    // 2. Draft Reply
    async draftReply(workspaceId: string, threadId: string, tone: 'neutral' | 'friendly' | 'direct') {
        await this.validateRateLimit(workspaceId);

        const thread = await this.prisma.emailThread.findUnique({
            where: { id: threadId },
            include: { messages: { orderBy: { receivedAt: 'asc' } } }
        });
        if (!thread || thread.workspaceId !== workspaceId) throw new BadRequestException('Thread not found');

        const history = thread.messages.map(m => `${m.from}: ${m.body}`).join('\n');

        const prompt = `
        Draft a reply to the following email thread.
        Tone: ${tone}.
        Keep it concise and professional.
        
        Thread History:
        ${history}
        
        Reply text only:
        `;

        const draft = await this.callGemini(prompt);

        // Log
        await this.prisma.aIRequest.create({
            data: {
                workspaceId,
                type: AIRequestType.REPLY_DRAFT,
                modelUsed: 'gemini-pro',
                inputTokens: prompt.length / 4,
                outputTokens: draft.length / 4,
            }
        });

        return { draft };
    }
}
