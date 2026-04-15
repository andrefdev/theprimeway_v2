# Build stage: compile TypeScript and prepare production bundle
FROM node:22-alpine AS base
RUN npm install -g pnpm@9.12.2

FROM base AS builder
WORKDIR /repo

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy workspace packages (shared, ui, config-ts)
COPY packages/ ./packages/

# Copy API app
COPY apps/api/ ./apps/api/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build the API (tsup compiles TypeScript to dist/)
RUN pnpm --filter @repo/api build

# Create a standalone production deployment with pnpm deploy
# This creates /deploy with:
#   - dist/ (compiled output)
#   - node_modules/ (production deps only, no devDependencies)
#   - package.json, package-lock (if exists)
#   - Workspace packages inlined into node_modules/@repo/*
RUN pnpm deploy --filter @repo/api --prod /deploy

# Generate Prisma client inside the deploy directory
# Prisma 7 generates into node_modules/@prisma/client (not .prisma/)
# Must run after pnpm deploy so the client lands in /deploy/node_modules/
WORKDIR /deploy
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
WORKDIR /repo

# Runtime stage: minimal image with only what's needed to run the API
FROM node:22-alpine AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

# Copy the production deployment bundle from builder
COPY --from=builder --chown=hono:nodejs /deploy .

# Copy Prisma schema and migrations (needed for runtime migrations)
COPY --from=builder --chown=hono:nodejs /repo/apps/api/prisma ./prisma

# Use the non-root user
USER hono

# Expose the API port
EXPOSE 3001

# Health check: verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the API server
CMD ["node", "dist/index.js"]
