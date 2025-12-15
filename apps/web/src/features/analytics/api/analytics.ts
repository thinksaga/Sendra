
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useWorkspace } from '../../../context/WorkspaceContext';

export interface AnalyticsSummary {
    totalSent: number;
    totalReplies: number;
    totalBounces: number;
    totalErrors: number;
    replyRate: number; // Percentage 0-100
    bounceRate: number; // Percentage 0-100
}

export interface CampaignAnalytics extends AnalyticsSummary {
    campaignId: string;
    campaignName: string;
    status: string;
}

export const useWorkspaceAnalytics = (timeRange: '7d' | '30d' | 'custom', startDate?: string, endDate?: string) => {
    const { currentWorkspace } = useWorkspace();
    return useQuery({
        queryKey: ['analytics', 'workspace', currentWorkspace?.id, timeRange, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ timeRange });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await api.get<AnalyticsSummary>('/analytics/workspace?' + params.toString());
            // Mock fallback if API not ready
            // return { totalSent: 1250, totalReplies: 45, totalBounces: 12, totalErrors: 5, replyRate: 3.6, bounceRate: 0.9 }; 
            return res.data;
        },
        enabled: !!currentWorkspace
    });
};

export const useCampaignsAnalytics = (timeRange: '7d' | '30d' | 'custom', startDate?: string, endDate?: string) => {
    const { currentWorkspace } = useWorkspace();
    return useQuery({
        queryKey: ['analytics', 'campaigns', currentWorkspace?.id, timeRange, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ timeRange });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await api.get<CampaignAnalytics[]>('/analytics/campaigns?' + params.toString());
            return res.data;
        },
        enabled: !!currentWorkspace
    });
};
