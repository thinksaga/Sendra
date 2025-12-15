
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface ThreadMessage {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string; // Plain text or HTML
    createdAt: string;
    direction: 'INBOUND' | 'OUTBOUND';
}

export interface Thread {
    id: string;
    leadId: string;
    leadEmail: string;
    leadName?: string;
    campaignId?: string;
    campaignName?: string;
    subject: string;
    snippet: string;
    lastMessageAt: string;
    isRead: boolean;
    status: 'OPEN' | 'INTERESTED' | 'NOT_INTERESTED' | 'LATER' | 'ARCHIVED';
    messages?: ThreadMessage[]; // For detail view
}

export const useThreads = (status?: string, page = 1) => {
    return useQuery({
        queryKey: ['threads', status, page],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString() });
            if (status) params.append('status', status);

            const res = await api.get<{ data: Thread[], total: number }>(`/unibox/threads?${params.toString()}`);
            return res.data;
        },
    });
};

export const useThread = (threadId: string | undefined) => {
    return useQuery({
        queryKey: ['thread', threadId],
        queryFn: async () => {
            if (!threadId) return null;
            const res = await api.get<Thread>(`/unibox/threads/${threadId}`);
            return res.data;
        },
        enabled: !!threadId,
    });
};

export const useMarkThreadRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
            await api.patch(`/unibox/threads/${id}/read`, { read });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
            queryClient.invalidateQueries({ queryKey: ['thread'] });
        }
    });
};

export const useUpdateThreadStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await api.patch(`/unibox/threads/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads'] });
            queryClient.invalidateQueries({ queryKey: ['thread'] });
        }
    });
};
