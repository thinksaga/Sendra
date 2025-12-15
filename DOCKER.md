# Docker Setup Guide

This document provides instructions for running the Sendra application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2+
- At least 4GB of free RAM
- Ports available: 80, 3000, 5432, 6379, 8080, 9000, 9001, 8025, 1025

## Quick Start

### 1. Configure Environment

Copy the Docker environment template:
```bash
cp .env.docker .env
```

Update the `.env` file with your specific configuration, especially:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `JWT_SECRET` - A secure secret for production

### 2. Build and Run

Build and start all services:
```bash
npm run docker:up:build
```

Or use the individual commands:
```bash
# Build images
npm run docker:build

# Start services
npm run docker:up
```

### 3. Initialize Database

Once the services are running, initialize the database:
```bash
docker exec -it sendra_backend sh -c "cd /app && pnpm --filter database migrate:dev"
```

Seed the database with initial data:
```bash
docker exec -it sendra_backend sh -c "cd /app && pnpm --filter database seed"
```

### 4. Access the Application

- **Web Application**: http://localhost
- **Backend API**: http://localhost:3000
- **Keycloak Admin**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Mailpit UI**: http://localhost:8025
- **Prisma Studio**: Run `docker exec -it sendra_backend sh -c "cd /app && pnpm --filter database studio"`

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build all Docker images |
| `npm run docker:up` | Start all services |
| `npm run docker:up:build` | Build and start all services |
| `npm run docker:down` | Stop all services |
| `npm run docker:logs` | View logs from all services |
| `npm run docker:clean` | Stop and remove all containers, volumes, and networks |
| `npm run docker:restart` | Restart all services |

## Service Architecture

The Docker Compose setup includes:

1. **postgres** - PostgreSQL 16 database
2. **redis** - Redis 7 for caching
3. **keycloak** - Keycloak 24 for authentication
4. **mailpit** - Email testing (SMTP + UI)
5. **minio** - Object storage (S3-compatible)
6. **backend** - NestJS API server
7. **web** - React frontend (served via nginx)

## Health Checks

All services include health checks. View service health:
```bash
docker ps
```

## Troubleshooting

### Services won't start
```bash
# Check logs
npm run docker:logs

# Check specific service
docker-compose logs backend
docker-compose logs web
```

### Port conflicts
If ports are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change host port (left side)
```

### Clean slate
To start fresh:
```bash
npm run docker:clean
npm run docker:up:build
```

### Database connection issues
Ensure Postgres is healthy:
```bash
docker-compose ps postgres
```

Reset database:
```bash
npm run docker:clean
npm run docker:up:build
```

## Development vs Production

### Development Mode
The current setup is optimized for development with:
- Hot reload disabled (containers use production builds)
- All services exposed on localhost
- Default credentials for services

### Production Deployment
For production:
1. Update all default passwords in `.env`
2. Set `JWT_SECRET` to a secure random value
3. Configure proper TLS certificates
4. Use secrets management (e.g., Docker Swarm secrets)
5. Implement proper backup strategies for volumes
6. Configure reverse proxy (e.g., Traefik, Caddy)

## Volumes

Persistent data is stored in Docker volumes:
- `postgres_data` - Database
- `redis_data` - Cache
- `minio_data` - Object storage

To backup volumes:
```bash
docker run --rm -v sendra_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Network

All services communicate on the `sendra_network` Docker network. Services can reach each other using their container names (e.g., `postgres`, `redis`, `backend`).
