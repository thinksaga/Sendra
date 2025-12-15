
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface AIReviewResult {
    spamRiskScore: number; // 0-100 (high is risky)
    personalizationScore: number; // 0-100
    subjectLineFeedback: string;
    deliverabilityWarnings: string[];
    overallFeedback: string;
}

export interface AIReplyDraft {
    draft: string;
    tone: string;
}

export const useReviewCampaignAI = () => {
    return useMutation({
        mutationFn: async (campaignId: string) => {
            const res = await api.post<AIReviewResult>(`/copilot/campaigns/${campaignId}/review`);
            return res.data;
        }
    });
};

export const useGenerateReplyDraftAI = () => {
    return useMutation({
        mutationFn: async ({ threadId, tone }: { threadId: string; tone: string }) => {
            const res = await api.post<AIReplyDraft>(`/copilot/threads/${threadId}/reply`, { tone });
            return res.data;
        }
    });
};
