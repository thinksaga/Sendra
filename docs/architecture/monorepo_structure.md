# Sendra Monorepo Architecture Design

## Core Philosophy
- **Monorepo Tool**: Turborepo + pnpm workspaces. (Fast, standard, low boilerplate).
- **Backend Pattern**: Modular Monolith. API and Worker share the same codebase (`apps/backend`) but run as separate entry points. This allows sharing services/entities without complex packaging overhead.
- **Frontend**: Single SPA (`apps/web`).
- **Database**: Centralized Prisma Client in strict library (`packages/database`).
- **Contracts**: Shared TypeScript DTOs/types (`packages/types`) to ensure FE/BE type safety.

## 1. Root-Level Structure

```text
/ (root)
├── apps/                  # Application containers
│   ├── web/               # React + Vite Frontend
│   └── backend/           # NestJS Monolith (API + Worker)
├── packages/              # Shared internal libraries
│   ├── database/          # Prisma Schema & Client
│   ├── types/             # Shared DTOs, Enums, Zod Schemas
│   ├── ui/                # (Optional) Shared React UI Kit
│   └── config/            # Shared configs (eslint, tsconfig, logger)
├── infra/                 # Infrastructure definitions
│   ├── docker/            # Dockerfiles for apps
│   └── local/             # Local dev resources (localstack, seeds)
├── .github/               # CI/CD workflows
├── docker-compose.yml     # Local dev orchestration
├── pnpm-workspace.yaml    # Workspace definition
├── turbo.json             # Turbo build pipeline config
└── README.md              # Setup instructions
```

## 2. Shared Packages Structure

### `packages/database`
Centralizes DB logic to prevent multiple Prisma clients.
```text
/packages/database
├── prisma/
│   └── schema.prisma      # Single source of truth for DB schema
├── src/
│   ├── client.ts          # Exports instantiated PrismaClient
│   ├── seed.ts            # Database seeding logic
│   └── index.ts           # Exports client and types
└── package.json
```

### `packages/types`
Strict contract between FE and BE.
```text
/packages/types
├── src/
│   ├── api/               # API Response interfaces
│   ├── auth/              # Auth related types
│   ├── events/            # Queue job payload types
│   └── index.ts
└── package.json
```

---

## 3. Backend App Structure (`apps/backend`)
**Pattern**: Modular Monolith.
**Entry Points**: 
- `main.ts` (HTTP Server)
- `worker.ts` (Queue Processor)

```text
/apps/backend
├── src/
│   ├── common/            # Global guards, filters, interceptors, utils
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── utils/
│   ├── config/            # Environment validation (ConfigModule)
│   ├── modules/           # Feature Modules (Domain functionality)
│   │   ├── auth/          # Keycloak integration
│   │   ├── campaigns/     # Outreach campaign logic
│   │   ├── ai/            # Gemini integration service
│   │   └── mailer/        # Email sending logic
│   ├── health/            # Health checks
│   ├── app.module.ts      # Main HTTP App Module
│   ├── worker.module.ts   # Worker App Module (imports specific modules only)
│   ├── main.ts            # Entry: HTTP API
│   └── worker.ts          # Entry: BullMQ Worker
├── test/                  # E2E Tests
└── package.json
```

**Worker Strategy**: 
The `worker.ts` bootstraps a NestJS standalone application with `WorkerModule`. `WorkerModule` imports only the necessary modules (e.g., `MailerModule`, `AiModule`) to process jobs defined in `packages/types`. This avoids loading the entire HTTP stack for background jobs.

---

## 4. Frontend App Structure (`apps/web`)

```text
/apps/web
├── src/
│   ├── app/               # App setup
│   │   ├── router.tsx     # Routing configuration
│   │   ├── provider.tsx   # Global providers (Auth, Theme, Query)
│   │   └── main.tsx       # Entry point
│   ├── assets/            # Static assets
│   ├── components/        # Shared components
│   │   ├── common/        # Buttons, Inputs, Cards (or import from packages/ui)
│   │   └── layout/        # Sidebar, Header, Shell
│   ├── features/          # Feature-based folder structure (Co-location)
│   │   ├── auth/
│   │   ├── campaigns/
│   │   │   ├── api/       # React Query hooks for this feature
│   │   │   ├── components/# Feature-specific components
│   │   │   └── routes/    # Page components for this feature
│   │   └── analytics/
│   ├── hooks/             # Global hooks
│   ├── lib/               # 3rd party lib wrappers (axios, analytics)
│   └── stores/            # Global state (Zustand/Jotai)
├── public/
├── index.html
└── vite.config.ts
```

---

## 5. Environment & Config Strategy
- **Local Dev**: A root `.env` file is loaded by Docker Compose.
- **Apps**: `apps/backend` checks `process.env` using `zod` or `joi` on startup within `ConfigModule`.
- **Frontend**: Vite loads `VITE_*` vars.
- **Validation**: Strict validation in Backend on startup to fail fast if keys (e.g. `GEMINI_API_KEY`) are missing.

## 6. Internal Communication
1.  **FE <-> BE**: 
    - REST API (JSON). 
    - Type safety ensured by importing types from `packages/types`.
2.  **BE <-> Worker**: 
    - **Producer**: Backend logic puts jobs into Redis via BullMQ.
    - **Consumer**: Worker process pops jobs.
    - **Events**: Defined in `packages/types` so payload structure is typed on both ends.
3.  **App <-> DB**: 
    - Direct via Prisma (TCP).
4.  **App <-> Cache**:
    - Direct via Redis (TCP).

## 7. Operational View (Docker Compose)
Each service gets a container.
- `postgres` (Base infra)
- `redis` (Base infra)
- `keycloak` (Auth)
- `api` (Runs `pnpm start:api` in `apps/backend`)
- `worker` (Runs `pnpm start:worker` in `apps/backend`)
- `web` (Runs `pnpm dev` or serves static build)

## 8. Development Workflow
1.  **Start**: `pnpm dev` at root (runs Turbo).
2.  **Turbo**:
    - Starts database (if dockerized scripts included).
    - Parallel starts `api`, `worker`, `web`.
3.  **Work**: 
    - Edit `packages/database`, run `push`.
    - Edit `apps/backend`, auto-restart.
    - Edit `apps/web`, HMR updates.
