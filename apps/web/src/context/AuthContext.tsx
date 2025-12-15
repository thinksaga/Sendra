
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import keycloak, { initKeycloak } from '../services/auth';

interface AuthContextType {
    authenticated: boolean;
    token: string | undefined;
    initialized: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Development mode - bypass Keycloak
const isDevelopment = import.meta.env.DEV;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authenticated, setAuthenticated] = useState(isDevelopment); // Auto-auth in dev
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (isDevelopment) {
            // Skip Keycloak in development
            console.log('🔓 Development mode: Skipping Keycloak authentication');
            setInitialized(true);
            return;
        }

        // Production: Initialize Keycloak
        keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false })
            .then((auth) => {
                setAuthenticated(auth);
                setInitialized(true);
            })
            .catch((err) => {
                console.error('Keycloak init fail', err);
                setInitialized(true);
            });
    }, []);

    return (
        <AuthContext.Provider value={{
            authenticated,
            token: isDevelopment ? 'dev-token' : keycloak.token,
            initialized,
            login: isDevelopment ? () => setAuthenticated(true) : keycloak.login,
            logout: isDevelopment ? () => setAuthenticated(false) : keycloak.logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
