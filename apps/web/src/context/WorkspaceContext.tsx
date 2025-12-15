
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

export interface Workspace {
    id: string;
    name: string;
    slug: string;
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    isLoading: boolean;
    switchWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const { authenticated } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authenticated) {
            loadWorkspaces();
        } else {
            setIsLoading(false);
        }
    }, [authenticated]);

    const loadWorkspaces = async () => {
        setIsLoading(true);
        try {
            // First fetch without header => Backend should return user's workspaces
            const res = await api.get<Workspace[]>('/workspaces');
            setWorkspaces(res.data);

            if (res.data.length > 0) {
                // Validation: Check if stored ID is still valid
                const storedId = localStorage.getItem('sendra_workspace_id');
                const valid = storedId ? res.data.find(w => w.id === storedId) : null;

                if (valid) {
                    setCurrentWorkspace(valid);
                } else {
                    // Default to first
                    switchWorkspace(res.data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load workspaces', err);
        } finally {
            setIsLoading(false);
        }
    };

    const switchWorkspace = (workspaceId: string) => {
        const ws = workspaces.find(w => w.id === workspaceId);
        if (ws) {
            setCurrentWorkspace(ws);
            localStorage.setItem('sendra_workspace_id', ws.id);

            // Optional: Refresh page to clear React Query caches if needed, or queryClient.invalidateQueries()
            // For V1 simple reload avoids stale data issues
            if (currentWorkspace && currentWorkspace.id !== workspaceId) {
                window.location.reload();
            }
        }
    };

    return (
        <WorkspaceContext.Provider value={{ workspaces, currentWorkspace, isLoading, switchWorkspace }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
    return context;
};
