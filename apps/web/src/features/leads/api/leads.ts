
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useWorkspace } from '../../../context/WorkspaceContext';

export interface Lead {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    status: 'NEW' | 'CONTACTED' | 'REPLIED' | 'BOUNCED' | 'UNSUBSCRIBED';
    campaignId?: string;
    createdAt: string;
}

export interface ImportResult {
    created: number;
    skipped: number;
    failed: number;
    errors: string[];
}

export const useLeads = (page = 1, limit = 50) => {
    const { currentWorkspace } = useWorkspace();
    return useQuery({
        queryKey: ['leads', currentWorkspace?.id, page],
        queryFn: async () => {
            // Mock paginated response structure if backend is simple list vs object
            const res = await api.get<{ data: Lead[], total: number } | Lead[]>(`/leads?page=${page}&limit=${limit}`);
            if (Array.isArray(res.data)) {
                return { data: res.data, total: res.data.length };
            }
            return res.data;
        },
        enabled: !!currentWorkspace,
    });
};

export const useCreateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Lead>) => {
            const res = await api.post<Lead>('/leads', data);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
    });
};

export const useUpdateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
            const res = await api.patch<Lead>(`/leads/${id}`, data);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
    });
};

export const useDeleteLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/leads/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
    });
};

export const useImportLeadsCsv = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { leads: Partial<Lead>[] }) => {
            // Sending JSON array of mapped leads for V1 simplicity
            // Alternatively, send FormData if backend expects file upload + mapping
            // Assuming endpoint accepts JSON array based on prompt 'column mapping'
            const res = await api.post<ImportResult>('/leads/import', payload);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
    });
};
