
import Keycloak from 'keycloak-js';
import { ENV } from '../config/env';

// Initialize Keycloak
const keycloak = new Keycloak({
    url: ENV.KEYCLOAK_URL,
    realm: ENV.KEYCLOAK_REALM,
    clientId: ENV.KEYCLOAK_CLIENT_ID,
});

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
    keycloak
        .init({
            onLoad: 'check-sso',
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            pkceMethod: 'S256',
            checkLoginIframe: false,
        })
        .then((authenticated) => {
            if (authenticated) {
                onAuthenticatedCallback();
            } else {
                // Optional: Force login immediately or let App handle public state
                console.log('Not authenticated');
            }
        })
        .catch(console.error);
};

export const doLogin = keycloak.login;
export const doLogout = keycloak.logout;
export const getToken = () => keycloak.token;
export const isLoggedIn = () => !!keycloak.token;
export const updateToken = (minValidity = 30) => keycloak.updateToken(minValidity);
export const getUsername = () => keycloak.tokenParsed?.preferred_username;
export const hasRole = (role: string) => keycloak.hasRealmRole(role);

export default keycloak;
