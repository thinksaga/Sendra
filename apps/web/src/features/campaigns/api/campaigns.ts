
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useWorkspace } from '../../../context/WorkspaceContext';

export interface Campaign {
    id: string;
    name: string;
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR';
    dailyLimit: number;
    createdAt: string;
    _count?: {
        leads: number;
        sent: number;
    }
}

export const useCampaigns = () => {
    const { currentWorkspace } = useWorkspace();
    return useQuery({
        queryKey: ['campaigns', currentWorkspace?.id],
        queryFn: async () => {
            if (!currentWorkspace) return [];
            const res = await api.get<Campaign[]>('/campaigns');
            // Mock data for V1 if backend returns empty during dev
            // return res.data;
            if (res.data.length === 0) return []; // Or mock
            return res.data;
        },
        enabled: !!currentWorkspace,
    });
};

export const usePauseCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/campaigns/${id}/pause`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    });
};

export const useResumeCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            // Assuming resume endpoint or update status
            await api.post(`/campaigns/${id}/resume`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    });
};

export const useDeleteCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/campaigns/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    });
};

export const useCampaign = (id: string) => {
    return useQuery({
        queryKey: ['campaign', id],
        queryFn: async () => {
            const res = await api.get<Campaign>(`/campaigns/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

export const useCreateCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string; dailyLimit: number }) => {
            const res = await api.post<Campaign>('/campaigns', data);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    });
};

export const useUpdateCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
            const res = await api.patch<Campaign>(`/campaigns/${id}`, data);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
        }
    });
};

export const useStartCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            // "Start" might be same as Resume, or a dedicated Endpoint. 
            // In V1, DRAFT -> RUNNING is the transition. 
            // Resume covers PAUSED -> RUNNING.
            // If backend allows /resume to work on Draft, we can reuse.
            // But let's assume /start for clarity or reuse /resume as prompt implies. 
            // Prompt says "Trigger campaign sending", let's use /resume logic for now as 'start' usually just sets status = RUNNING.
            await api.post(`/campaigns/${id}/resume`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    });
};
