# Sendra

Sendra is a powerful, modern platform for managing workspaces, campaigns, and notifications, built with a robust microservices-ready architecture.

## 🚀 Connect & Scale
Sendra provides a comprehensive backend and a sleek, responsive frontend to manage your business operations efficiently.

## 🛠 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: TanStack Query
- **Authentication**: Keycloak (OIDC) via `keycloak-js`

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL (Prisma ORM)
- **Queue**: BullMQ with Redis
- **Storage**: MinIO (S3 Compatible)
- **Email**: SMTP (Mailpit for dev)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Ready for Kubernetes

## ✨ Features

- **Workspaces**: Multi-tenant workspace management
- **Campaigns**: Create and manage email marketing campaigns
- **Notifications**: Real-time notification system
- **Authentication**: Secure RBAC with Keycloak
- **Media Storage**: S3-compatible object storage

## 🏁 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+) & pnpm

### Quick Start (Docker)

1. **Clone the repository**
   ```bash
   git clone https://github.com/thinksaga/Sendra.git
   cd Sendra
   ```

2. **Start Infrastructure & Backend**
   ```bash
   npm run docker:up:build
   ```
   This starts Postgres, Redis, Keycloak, MinIO, Mailpit, and the Backend API.

3. **Start Frontend (Local Dev)**
   ```bash
   cd apps/web
   pnpm install
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

> **Note**: The backend runs on `http://localhost:3000`.

### Development Credentials

- **Keycloak Console**: `http://localhost:8080` (admin/admin)
- **MinIO Console**: `http://localhost:9001` (minioadmin/minioadmin)
- **Mailpit**: `http://localhost:8025`

## 🧪 Development Notes

- **Authentication**: In development mode, the frontend uses a mock token to bypass Keycloak login for speed. The backend automatically provisions a Dev User.
- **Database**: Prisma migrations are applied automatically in the container, or you can run `pnpm prisma migrate dev` locally.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
