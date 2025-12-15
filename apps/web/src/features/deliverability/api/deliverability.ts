
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface HealthStatus {
    score: number;
    status: 'SAFE' | 'WARNING' | 'RISKY';
    reasons: string[];
    lastUpdated: string;
}

export interface EmailAccountHealth extends HealthStatus {
    id: string;
    email: string;
    provider: string; // e.g., 'gmail', 'outlook'
}

export interface DomainHealth extends HealthStatus {
    domain: string;
    campaignsUsing: number;
}

export const useEmailAccountHealth = () => {
    return useQuery({
        queryKey: ['health', 'accounts'],
        queryFn: async () => {
            const res = await api.get<EmailAccountHealth[]>('/deliverability/accounts');
            return res.data;
        },
    });
};

export const useDomainHealth = () => {
    return useQuery({
        queryKey: ['health', 'domains'],
        queryFn: async () => {
            const res = await api.get<DomainHealth[]>('/deliverability/domains');
            return res.data;
        },
    });
};
