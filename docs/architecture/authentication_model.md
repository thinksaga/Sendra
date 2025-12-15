# Sendra Authentication Design (Keycloak)

## Core Philosophy
- **Identity Provider (IdP)**: Keycloak handles *Authentication* (Who are you?).
- **Service Provider (SP)**: Sendra (NestJS) handles *Authorization* (What can you do?).
- **Single Realm**: We use one realm for the entire SaaS to simplify management. Multi-tenancy is logical (workspace_id in DB), not physical (realms).

## 1. Realm Configuration
-   **Name**: `Sendra`
-   **Purpose**: Centralize user identity login options (Email/Pass, Google, Microsoft).
-   **Registration**: Enabled (Self-service signup).
-   **Email Verification**: Enabled (Critical for SaaS to prevent spam).
-   **Login Theme**: Custom Sendra-branded theme (crucial for trust).

## 2. Client Definitions

### A. Frontend Client (`sendra-web`)
-   **Type**: Public Client
-   **Protocol**: OpenID Connect (OIDC)
-   **Flow**: Authorization Code Flow with PKCE (Proof Key for Code Exchange).
-   **Root URL**: `http://localhost:3000` (Dev) / `https://app.sendra.io` (Prod).
-   **Redirect URIs**: `/*` (or specific `/auth/callback`).
-   **Web Origins**: `+` (or specific CORS domains).

### B. Backend Client (`sendra-api`)
-   **Type**: Bearer-only (Confidential)
-   **Purpose**: Validating tokens sent by the frontend. Does NOT initiate logins.
-   **Access Type**: Confidential (though for simple JWT validation, public often suffices, but confidential allows for future introspection if needed).

## 3. OAuth2 / OIDC Flow
**Flow**: `Authorization Code + PKCE`
**Reasoning**:
-   Standard for SPA (React) security.
-   Prevents interception attacks better than Implicit Flow (deprecated).
-   No client secrets stored in the browser.

**Sequence**:
1.  User clicks "Login" in React.
2.  Redirected to Keycloak Login Page.
3.  User authenticates (Email or Social).
4.  Keycloak redirects back with `code`.
5.  React exchanges `code` for `access_token` and `refresh_token`.
6.  React attaches `access_token` to API requests.

## 4. Token Strategy
-   **Access Token**:
    -   Type: JWT (Stateless validation).
    -   Lifespan: Short (e.g., 5-15 minutes).
    -   Claims: `sub` (Keycloak UUID), `email`, `email_verified`, `name`.
-   **Refresh Token**:
    -   Lifespan: Long (e.g., 7-30 days).
    -   Purpose: Obtain new access tokens without prompting user.
    -   Revocation: On logout or security event (password change).

## 5. Roles & Permissions (Minimalist)
**Keycloak Implementation**:
-   **NO** specific workspace roles (e.g., `workspace_123_admin`) in Keycloak. This leads to "Token Bloat" and scaling limits.
-   **Global Roles ONLY**:
    -   `admin`: Super admin for Sendra platform management (optional).
    -   `user`: Default role for all logged-in users.

**Permission Logic**:
-   Actual SaaS permissions (Owner, Editor, Viewer within a Workspace) live in the **Postgres Database**.
-   Guard logic: `AuthGuard` checks valid JWT -> `PermissionsGuard` checks DB for `(user_id, workspace_id)`.

## 6. Identity Providers (Social Login)
-   **Google**: 
    -   Scope: `openid email profile`
    -   Mapper: standard OIDC.
-   **Microsoft**:
    -   Critical for B2B outreach platforms to ease SMTP integration later.
    -   Scope: `User.Read`.

## 7. User Mapping (Sendra <-> Keycloak)
-   **Shared Key**: `sub` (Subject ID / UUID) from Keycloak is the Primary Link.
-   **Flow**:
    1.  User Signs up in Keycloak.
    2.  User lands on Sendra Dashboard.
    3.  Frontend calls `GET /api/v1/me`.
    4.  Backend checks `users` table for `keycloak_id == token.sub`.
    5.  **If Missing**: Create user record in Postgres on-the-fly (JIT Provisioning) using token email/name.
    6.  **If Present**: Return user data and workspaces.

## 8. Trusted vs. Untrusted Information
-   **Trusted (from Token)**:
    -   `sub` (Identity)
    -   `email_verified` (Security status)
-   **NOT Trusted (from Token)**:
    -   Can user delete Workspace X? (Check DB)
    -   Is subscription active? (Check DB/Stripe)

## 9. Local Development Considerations
-   **Realm Import**: Save `realm-export.json` to predefined folder.
-   **Hosts file**: Map `127.0.0.1 keycloak` if dealing with strict cookies/redirects, otherwise `localhost` works fine.
-   **Test Users**: Create `test-user@sendra.local` / `test-admin@sendra.local` in import file.

## 10. Common Pitfalls to Avoid
-   **Putting App Data in Attributes**: Do not store "Plan Level" or "Preferences" in Keycloak attributes. Hard to sync, search, and manage.
-   **One Realm Per Customer**: Does not scale for generic SaaS. Use logical separation.
-   **Implicit Flow**: Avoid. It's insecure.
-   **Long Access Tokens**: If 24h access tokens are used, you can't revoke access quickly. Use short access + refresh.
