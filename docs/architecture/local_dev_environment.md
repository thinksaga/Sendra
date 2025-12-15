# Sendra Local Development Environment Design

## Core Philosophy
- **Hybrid Approach**: Infrastructure (DB, Redis, Auth) runs in Docker. Applications (Node/Typescript) run on host machine via Turbo/PNPM.
- **Why?**: Running Node apps in Docker during dev is slow (rebuilds/file sync). Running them on host is fast and allows easy debugging.
- **Single Command**: `docker-compose up` starts infra. `pnpm dev` starts apps.

## 1. Required Services (Containers)

We only dockerize what we *don't* want to install/manage manually on the host.

1.  **`postgres`**: Main Database (PostgreSQL 16+)
2.  **`redis`**: Queue & Cache backing (Redis 7+)
3.  **`keycloak`**: Identity Provider (Keycloak 24+)
4.  **`mailpit`** (Optional but recommended): SMTP Catcher for testing emails locally without sending real spam.

*Note: Frontend, Backend API, and Worker run on the HOST machine, not in containers, for better DX.*

## 2. Docker Compose Structure

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    # ... healthcheck, ports, env

  redis:
    image: redis:7-alpine
    # ... healthcheck, ports

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev --import-realm
    # ... ports, volumes (shared import folder)

  mailpit:
    image: axllent/mailpit
    # ... ports (UI and SMTP)
```

## 3. Volume Strategy (Persistence)

We need data to survive restarts but allow easy resets.

-   **Postgres Data**: Named volume `postgres_data`.
    -   *Reset*: `docker-compose down -v`
-   **Keycloak DB**: Use an internal H2 file or connect Keycloak to the Postgres container (separate DB). For dev simplicity, Keycloak often uses its own embedded DB or we give it a Postgres DB. Let's stick to **Embedded H2 for Dev** or a **Separate Schema in Postgres** to keep container count low.
    -   *Decision*: Use `postgres` container for Keycloak storage too (create a `keycloak` DB on init).
-   **Redis**: No persistence needed for dev (ephemeral).
-   **Keycloak Config**: Bind mount `./infra/local/keycloak-realm.json` to `/opt/keycloak/data/import/realm.json` for auto-importing the basic setup.

## 4. Environment Variable Strategy

-   **Root `.env`**: Single source of truth. Contains secrets and config shared by Docker and Apps.
    -   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_URL`
-   **Docker**: Loads `.env` automatically.
-   **NestJS**: Uses `@nestjs/config` pointing to root `.env`.
-   **Vite**: Uses `dotenv` or Vite's env loader pointing to root `.env`.

**Git Strategy**:
-   Checking in `.env.example` with safe defaults.
-   `.env` is git-ignored.

## 5. Networking Strategy

-   **Host Ports**:
    -   `5432`: Postgres (exposed to host for Prisma Studio / App access)
    -   `6379`: Redis
    -   `8080`: Keycloak (Auth)
    -   `8025`: Mailpit UI
    -   `1025`: Mailpit SMTP
-   **Service-to-Service**:
    -   Apps (Host) -> Docker: Connect via `localhost:PORT`.
    -   Docker -> Docker: Connect via service name (e.g., Keycloak -> Postgres via `postgres:5432`).

## 6. Keycloak Setup (Local Dev)

1.  **Realm Import**: Create a `infra/local/realm-export.json` file.
2.  **Startup**: Keycloak container starts with `--import-realm`.
3.  **Pre-configured**:
    -   Realm: `Sendra`
    -   Client: `sendra-web` (Public), `sendra-api` (Confidential/Bearer-only)
    -   Admin User: `admin/admin` (configured via env vars `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`).

## 7. Prisma + Postgres Setup

-   **Init**: Container uses `/docker-entrypoint-initdb.d/` to run a script that creates:
    -   `sendra_db` (App data)
    -   `keycloak_db` (Auth data)
-   **Migration**: Developer runs `pnpm db:migrate` (runs `prisma migrate dev`) from host.
-   **Seeding**: `pnpm db:seed` runs `ts-node packages/database/src/seed.ts`.

## 8. Application Execution Model (The "How to Run")

1.  **Infrastructure**:
    -   `docker-compose up -d` (Starts DB, Redis, Keycloak)
2.  **Applications (Host)**:
    -   `pnpm dev` (Runs Turbo pipeline)
        -   `apps/backend`: `nest start --watch`
        -   `apps/worker`: `nest start --watch --entryFile worker`
        -   `apps/web`: `vite`
3.  **Why this split?**
    -   Fastest feedback loop.
    -   Node modules stay on host (no volume mounting hell).
    -   Debuggers attach easily.

## 9. Common Local Dev Commands

-   **Start Infra**: `pnpm env:up` (alias for `docker-compose up -d`)
-   **Stop Infra**: `pnpm env:down`
-   **Reset Data**: `pnpm env:reset` (alias for `docker-compose down -v && docker-compose up -d`)
-   **Start Apps**: `pnpm dev`
-   **Database**:
    -   `pnpm db:migrate`: Sync schema
    -   `pnpm db:studio`: GUI for DB
