
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

export const useNotifications = (page = 1, limit = 20) => {
    return useQuery({
        queryKey: ['notifications', page],
        queryFn: async () => {
            const res = await api.get<{ data: Notification[], total: number, unreadCount: number }>(`/notifications?page=${page}&limit=${limit}`);
            return res.data;
        },
        refetchInterval: 30000, // Poll every 30s
        refetchOnWindowFocus: true
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await api.post(`/notifications/read-all`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};
