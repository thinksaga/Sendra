import axios from 'axios';
import { ENV } from '../config/env';
import keycloak, { updateToken } from '../services/auth';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true,
});

api.interceptors.request.use(
    async (config) => {
        if (keycloak.token) {
            try {
                await updateToken(30); // Refresh if expiring in <30s
                config.headers.Authorization = `Bearer ${keycloak.token}`;

                // Attach Workspace ID if present
                const workspaceId = localStorage.getItem('sendra_workspace_id');
                if (workspaceId) {
                    config.headers['x-workspace-id'] = workspaceId;
                }
            } catch (error) {
                console.error('Failed to refresh token', error);
                keycloak.login();
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto-logout on 401? Or refresh? 
            // If refresh failed above, keycloak login is called.
            // This catches backend rejection.
        }
        return Promise.reject(error);
    }
);
