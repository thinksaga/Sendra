# Base stage - dependencies
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=dependencies /app/packages/database/node_modules ./packages/database/node_modules
COPY . .
RUN pnpm --filter database generate
RUN pnpm --filter sendra-backend build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy Prisma schema and packages (needed for Prisma generate)
COPY --from=build /app/packages ./packages

# Generate Prisma client
WORKDIR /app/packages/database
RUN npx prisma generate
WORKDIR /app

# Copy built application
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3000

CMD ["node", "/app/apps/backend/dist/apps/backend/src/main.js"]
