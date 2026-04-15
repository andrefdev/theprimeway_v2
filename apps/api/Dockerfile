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

# Build shared package (so dist/ JS files exist for Node.js runtime in production)
RUN pnpm --filter @repo/shared build

# Generate Prisma client (needed for TypeScript DTS generation)
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm --filter @repo/api exec prisma generate

# Build the API (tsup compiles TypeScript to dist/)
RUN pnpm --filter @repo/api build

# Create a standalone production deployment with pnpm deploy
RUN pnpm deploy --filter @repo/api --prod /deploy

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

# Install Prisma CLI + all transitive deps for runtime migrations
# npm install in /tmp to avoid workspace:* in the deploy package.json,
# then merge into /app/node_modules (preserves existing .prisma client)
RUN cd /tmp && npm init -y > /dev/null 2>&1 && npm install prisma@7 && \
    cp -rn /tmp/node_modules/* /app/node_modules/ && \
    cp -r /tmp/node_modules/@prisma/* /app/node_modules/@prisma/ && \
    chown -R hono:nodejs /app/node_modules && \
    rm -rf /tmp/node_modules /tmp/package.json /tmp/package-lock.json

# Generate Prisma client in the runtime node_modules structure
# This places .prisma/client in the correct location for pnpm's layout
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    node node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma && \
    chown -R hono:nodejs /app/node_modules/.prisma

# Use the non-root user
USER hono

# Expose the API port
EXPOSE 3001

# Health check: verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start the API server
CMD ["node", "dist/index.js"]
