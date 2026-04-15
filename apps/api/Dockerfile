# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN npm install -g pnpm@9.12.2

FROM base AS builder
WORKDIR /repo

# Copy workspace config + source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build @repo/shared (tsup needs its dist/ to bundle into API)
RUN pnpm --filter @repo/shared build

# Generate Prisma client (needed for TypeScript types during build)
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    pnpm --filter @repo/api exec prisma generate

# Build API (tsup bundles @repo/shared via noExternal, externalizes npm deps)
RUN pnpm --filter @repo/api build

# Generate a clean package.json for runtime (no workspace:* refs)
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('apps/api/package.json', 'utf8')); \
  const deps = { ...pkg.dependencies }; \
  delete deps['@repo/shared']; \
  deps['prisma'] = pkg.devDependencies['prisma'] || '^7.6.0'; \
  const out = { name: 'theprimeway-api', type: 'module', dependencies: deps }; \
  fs.writeFileSync('/runtime-package.json', JSON.stringify(out, null, 2));"

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

# Copy built API bundle and Prisma schema + migrations
COPY --from=builder --chown=hono:nodejs /repo/apps/api/dist ./dist
COPY --from=builder --chown=hono:nodejs /repo/apps/api/prisma ./prisma
COPY --from=builder --chown=hono:nodejs /runtime-package.json ./package.json

# Install production deps with npm (flat node_modules — no pnpm complexity)
RUN npm install --omit=dev 2>&1 | tail -5

# Generate Prisma client in the flat node_modules (correct .prisma location)
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    npx prisma generate --schema=./prisma/schema.prisma

RUN chown -R hono:nodejs /app

USER hono
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
