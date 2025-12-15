
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface CampaignLead {
    id: string; // This is usually the link ID or the Lead ID depending on backend. Assuming Lead ID with extra info attached or a Link Object.
    // For this UI, we likely receive a flattened object or the Lead object with campaign-specific fields.
    // Let's assume the backend returns the Lead object augmented with CampaignLead status.
    leadId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'PENDING' | 'ACTIVE' | 'STOPPED' | 'COMPLETED' | 'FAILED';
    currentStep: number;
    lastSentAt?: string;
}

export const useCampaignLeads = (campaignId: string, page = 1) => {
    return useQuery({
        queryKey: ['campaign-leads', campaignId, page],
        queryFn: async () => {
            const res = await api.get<{ data: CampaignLead[], total: number }>(`/campaigns/${campaignId}/leads?page=${page}`);
            return res.data;
        },
        enabled: !!campaignId,
    });
};

export const useAddLeadsToCampaign = (campaignId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (leadIds: string[]) => {
            const res = await api.post(`/campaigns/${campaignId}/leads`, { leadIds });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign-leads', campaignId] });
        }
    });
};

export const useRemoveLeadFromCampaign = (campaignId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (leadId: string) => {
            await api.delete(`/campaigns/${campaignId}/leads/${leadId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign-leads', campaignId] });
        }
    });
};
