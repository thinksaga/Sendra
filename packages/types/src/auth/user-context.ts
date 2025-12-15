
export interface UserContext {
  id: string; // Internal Postgres ID
  keycloakId: string; // Keycloak 'sub'
  email: string;
  email_verified: boolean;
  resource_access?: Record<string, any>;
  realm_access?: {
    roles: string[];
  };
}
