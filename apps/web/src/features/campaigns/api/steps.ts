
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface CampaignStep {
    id: string;
    campaignId: string;
    templateId?: string | null;
    subject: string;
    content: string; // Plain text for now
    order: number;
    waitDays: number;
}

export const useCampaignSteps = (campaignId: string) => {
    return useQuery({
        queryKey: ['campaign-steps', campaignId],
        queryFn: async () => {
            const res = await api.get<CampaignStep[]>(`/campaigns/${campaignId}/steps`);
            // Ensure sorted by order, though backend should do this
            return res.data;
        },
        enabled: !!campaignId,
    });
};

export const useAddStep = (campaignId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { subject: string; content: string; waitDays: number }) => {
            const res = await api.post<CampaignStep>(`/campaigns/${campaignId}/steps`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign-steps', campaignId] });
        }
    });
};

export const useUpdateStep = (campaignId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ stepId, data }: { stepId: string; data: Partial<CampaignStep> }) => {
            const res = await api.patch<CampaignStep>(`/campaigns/${campaignId}/steps/${stepId}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign-steps', campaignId] });
        }
    });
};

export const useDeleteStep = (campaignId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (stepId: string) => {
            await api.delete(`/campaigns/${campaignId}/steps/${stepId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign-steps', campaignId] });
        }
    });
};

export const useReorderSteps = (campaignId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (stepIdOrders: { id: string; order: number }[]) => {
            await api.post(`/campaigns/${campaignId}/steps/reorder`, { steps: stepIdOrders });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign-steps', campaignId] });
        }
    });
};
