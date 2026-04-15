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

# Generate Prisma client in /repo where all deps (including dotenv) are available
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm --filter @repo/api exec prisma generate

# Create a standalone production deployment with pnpm deploy
RUN pnpm deploy --filter @repo/api --prod /deploy

# Copy generated Prisma client into deploy directory
# pnpm deploy --prod strips it; check app-level then root-level, follow symlinks
RUN for dir in apps/api/node_modules/.prisma node_modules/.prisma; do \
      if [ -d "$dir" ]; then cp -rL "$dir" /deploy/node_modules/.prisma && break; fi; \
    done

# Stage Prisma CLI + its sibling deps to a known path for the runtime image
# (glob patterns don't work in COPY --from, so we collect them here)
RUN mkdir -p /prisma-cli && \
    cp -rL /repo/node_modules/.pnpm/prisma@*/node_modules/prisma /prisma-cli/prisma && \
    cp -rL /repo/node_modules/.pnpm/prisma@*/node_modules/@prisma /prisma-cli/@prisma

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

# Copy Prisma CLI + engines (needed for `prisma migrate deploy`)
# pnpm deploy --prod strips devDependencies, so we copy from the builder stage
COPY --from=builder --chown=hono:nodejs /prisma-cli/prisma ./node_modules/prisma
# Merge @prisma CLI deps (engines, config, etc.) without overwriting .prisma client
COPY --from=builder --chown=hono:nodejs /prisma-cli/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder --chown=hono:nodejs /prisma-cli/@prisma/config ./node_modules/@prisma/config

# Use the non-root user
USER hono

# Expose the API port
EXPOSE 3001

# Health check: verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the API server
CMD ["node", "dist/index.js"]
