# ThePrimeWay Deployment Architecture

## Overview

ThePrimeWay is a pnpm monorepo deployed via **GitHub Actions** to a single Linux VPS running **Docker Compose**. Every push to `main` triggers a CI/CD pipeline that builds only what changed, pushes Docker images to GHCR, and deploys to the server via SSH.

**Stack**: pnpm monorepo + Turborepo | Docker multi-stage builds | GHCR | Docker Compose | Nginx reverse proxy | Let's Encrypt SSL

**Domains** (staging):
- `staging-api.theprimeway.app` → API (Hono on Node.js)
- `staging.theprimeway.app` → Web SPA (Vite + React)
- `admin.theprimeway.app` → Admin SPA (Vite + React)

---

## Architecture Diagram

```
                         Internet
                            │
                     ┌──────┴──────┐
                     │   Nginx     │  ports 80 (→301 HTTPS), 443
                     │  (reverse   │  SSL termination (Let's Encrypt)
                     │   proxy)    │  Volume: /etc/letsencrypt (read-only)
                     └──┬───┬───┬──┘
                        │   │   │
          ┌─────────────┘   │   └─────────────┐
          │                 │                 │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼─────┐
   │  web:80     │  │  api:3001   │  │  admin:80   │
   │  nginx      │  │  Hono +     │  │  nginx      │
   │  (Vite SPA) │  │  Node.js 22 │  │  (Vite SPA) │
   └─────────────┘  └──────┬──────┘  └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  migrate    │  runs once → exits
                    │  (Prisma 7) │  prisma migrate deploy
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │  external (not in Docker)
                    └─────────────┘

   All containers on bridge network: theprimeway-net
```

---

## CI/CD Pipeline (`.github/workflows/deploy.yml`)

### 1. Change Detection

Uses `dorny/paths-filter` to determine which services need rebuilding:

| Filter  | Paths watched                                        | Triggers       |
|---------|------------------------------------------------------|----------------|
| `api`   | `apps/api/**`, `packages/shared/**`, `packages/config-ts/**` | API build      |
| `web`   | `apps/web/**`, `packages/shared/**`, `packages/ui/**`, `nginx/spa.conf` | Web build      |
| `admin` | `apps/admin/**`, `packages/shared/**`, `packages/ui/**`, `nginx/spa.conf` | Admin build    |
| `infra` | `docker-compose.prod.yml`, `nginx/**`, `.github/workflows/deploy.yml` | Deploy only    |

> `nginx/spa.conf` is in web/admin filters because it's baked into their Docker images (COPY at build time).

### 2. Build Jobs (parallel, conditional)

Each build job only runs if its filter matched. All three run in parallel when triggered.

```
push to main
    │
    ├─ changes detected?
    │   ├─ api changed?    → build-api  (Docker build + push to GHCR)
    │   ├─ web changed?    → build-web  (Docker build + push to GHCR)
    │   ├─ admin changed?  → build-admin (Docker build + push to GHCR)
    │   └─ infra changed?  → (no build, just deploy)
    │
    └─ deploy (runs if any filter matched and no builds failed)
```

Images are tagged `:latest` and `:$GITHUB_SHA` for rollback capability.

### 3. Deploy Step

Runs after all builds complete (or are skipped). Steps:

1. **Generate `.env`** from GitHub Secrets (see `GITHUB_SECRETS_CHECKLIST.md`)
   - Includes `DOCKER_REGISTRY` for compose variable substitution
   - Uses `printf` with single quotes to handle special characters
2. **SCP config files** to server:
   - `.env` → `/var/www/theprimeway/.env`
   - `docker-compose.prod.yml` → `/var/www/theprimeway/`
   - `nginx/theprimeway.conf` + `nginx/spa.conf` → `/var/www/theprimeway/nginx/`
3. **SSH and deploy**:
   ```bash
   docker compose -f docker-compose.prod.yml pull --ignore-buildable || true
   docker compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
4. **Health checks** (from CI runner via public HTTPS):
   - API: `curl --retry 10 --retry-max-time 60 https://staging-api.theprimeway.app/api/health`
   - Web: `curl --retry 10 --retry-max-time 60 https://staging.theprimeway.app`
   - Admin: `curl --retry 10 --retry-max-time 60 https://admin.theprimeway.app`

---

## Docker Build Process

### API (`apps/api/Dockerfile`)

Two-stage build: **pnpm monorepo build** → **npm flat runtime**.

```
┌─ Builder stage (node:22-alpine) ──────────────────────────────┐
│                                                                │
│  1. pnpm install --frozen-lockfile (full monorepo)            │
│  2. pnpm --filter @repo/shared build  (tsup → ESM JS + .d.ts)│
│  3. prisma generate  (creates .prisma/client types for build) │
│  4. pnpm --filter @repo/api build  (tsup bundles to dist/)   │
│  5. Generate clean package.json (no workspace:* refs)         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─ Runtime stage (node:22-alpine) ──────────────────────────────┐
│                                                                │
│  COPY: dist/, prisma/, prisma.config.ts, package.json         │
│  npm install --omit=dev  (flat node_modules)                  │
│                                                                │
│  CMD: npx prisma generate && node dist/index.js               │
│       └─ generates .prisma/client in correct runtime location │
│                                                                │
│  Runs as: hono:nodejs (uid 1001, non-root)                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- **tsup bundles `@repo/shared`** via `noExternal: ["@repo/shared"]` so it's embedded in dist — not needed at runtime
- **tsup externalizes `dotenv`** via `external: ["dotenv"]` because dotenv is CJS and uses `require('fs')` which breaks in ESM bundles
- **npm install (not pnpm)** in runtime stage: flat `node_modules` so `.prisma/client` resolves correctly (pnpm's `.pnpm/` virtual store causes resolution failures)
- **Prisma generate at startup** (not build time): the `.prisma/client` location must match the runtime `node_modules` layout, which differs between build (pnpm) and runtime (npm)
- **`prisma.config.ts`** is required by Prisma 7: it defines `datasource.url` via `env('DATABASE_URL')` (no longer in `schema.prisma`)

### Web / Admin (`apps/web/Dockerfile`, `apps/admin/Dockerfile`)

Two-stage build: **pnpm monorepo build** → **nginx static server**.

```
┌─ Builder stage (node:22-alpine) ──────────────────────────────┐
│                                                                │
│  1. pnpm install --frozen-lockfile (full monorepo)            │
│  2. pnpm --filter @repo/shared build  (tsup → ESM JS + .d.ts)│
│  3. pnpm --filter @repo/web build  (tsc --noEmit && vite build)│
│                                                                │
│  Build-time ARGs (baked into JS bundle, not secrets):         │
│    VITE_GOOGLE_CLIENT_ID, VITE_APPLE_CLIENT_ID,              │
│    VITE_APPLE_REDIRECT_URI                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─ Runtime stage (nginx:alpine) ────────────────────────────────┐
│                                                                │
│  COPY: dist/ → /usr/share/nginx/html                          │
│  COPY: nginx/spa.conf → /etc/nginx/conf.d/default.conf       │
│                                                                │
│  nginx serves static files with:                              │
│    - Hashed assets (1-year cache)                             │
│    - index.html (no-cache, always fresh)                      │
│    - SPA fallback (try_files → /index.html)                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- `@repo/shared` must be built BEFORE the SPA build (exports point to `dist/`, not raw `.ts`)
- `@repo/ui` exports raw `.ts/.tsx` — Vite handles transpilation, no build step needed
- `nginx/spa.conf` is baked into the image (not a volume mount)

---

## Monorepo Build Chain

```
packages/shared        (tsup → ESM JS + .d.ts)
    │
    ├──▶ apps/api      (tsup → single ESM bundle, @repo/shared inlined)
    ├──▶ apps/web      (vite build, imports shared from dist/)
    └──▶ apps/admin    (vite build, imports shared from dist/)

packages/ui            (raw .ts/.tsx, no build step)
    ├──▶ apps/web      (vite transpiles on the fly)
    └──▶ apps/admin    (vite transpiles on the fly)
```

**`@repo/shared` exports** use conditional resolution:
```json
{
  "./types": {
    "types": "./dist/types/index.d.ts",
    "import": "./dist/types/index.js",
    "default": "./src/types/index.ts"
  }
}
```
- `import` condition → bundlers and Node ESM resolve to built JS
- `default` condition → dev tools (e.g., tsx) resolve to raw TS
- `types` condition → TypeScript resolves declarations

---

## Prisma 7 Setup

Prisma 7 moved database URL configuration out of `schema.prisma` into `prisma.config.ts`:

```
apps/api/
├── prisma/
│   ├── schema.prisma       # Models only (no datasource url)
│   └── migrations/         # SQL migration files
├── prisma.config.ts        # datasource.url via env('DATABASE_URL')
└── src/lib/prisma.ts       # PrismaClient with pg adapter
```

**`prisma.config.ts`** (loaded by all Prisma CLI commands):
```ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
```

**CJS/ESM interop** in `src/lib/prisma.ts`:
```ts
// @prisma/client is CJS — use default import in ESM
import PrismaClientPkg from '@prisma/client'
const { PrismaClient } = PrismaClientPkg
```

**Migration flow** in Docker:
1. `migrate` container starts with the API image
2. Runs `npx prisma migrate deploy` (applies pending migrations)
3. Exits — API container starts only after migrate succeeds (`service_completed_successfully`)

---

## Nginx Configuration

Two config files serve different purposes:

### `nginx/theprimeway.conf` (reverse proxy)
- Mounted as a volume in the nginx container (live, not baked in)
- Defines server blocks for each domain
- HTTP (80) → 301 redirect to HTTPS
- HTTPS (443) → proxy to upstream containers
- SSL certificates from Let's Encrypt (`/etc/letsencrypt/`)
- WebSocket support for API
- Gzip compression

```
staging-api.theprimeway.app  →  http://api:3001
staging.theprimeway.app      →  http://web:80  (+ /api → http://api:3001)
admin.theprimeway.app        →  http://admin:80
```

### `nginx/spa.conf` (SPA containers)
- Baked into web/admin Docker images at build time
- Serves Vite-compiled static files
- Asset caching (hashed filenames → 1 year)
- `index.html` → no-cache (clients always get latest)
- SPA routing fallback (`try_files $uri $uri/ /index.html`)

---

## Health Checks

### Docker Compose health checks (inside containers)

| Service | Check                                                  | Notes                                    |
|---------|--------------------------------------------------------|------------------------------------------|
| api     | `node -e "fetch('http://localhost:3001/api/health')…"` | Node-based, verifies app logic           |
| web     | `wget -qO /dev/null http://localhost/index.html`       | BusyBox wget compatible (nginx:alpine)   |
| admin   | `wget -qO /dev/null http://localhost/index.html`       | BusyBox wget compatible (nginx:alpine)   |
| nginx   | `pgrep nginx`                                          | Process check (avoids 301→HTTPS issue)   |

All: interval 30s, timeout 10s, start_period 15s, retries 3.

> **Why not `wget --spider --tries=1`?** nginx:alpine uses BusyBox wget which doesn't support GNU flags like `--tries`. The `--spider` flag has inconsistent behavior across BusyBox versions. `wget -qO /dev/null` is universally compatible.

> **Why `pgrep` for nginx?** The reverse proxy returns 301 (HTTP→HTTPS) for all port 80 requests. BusyBox wget can't follow the redirect to HTTPS (no valid cert for localhost). Checking the process is alive is sufficient — Docker restarts the container if nginx exits.

### CI health checks (from GitHub Actions runner)

After deploy, curl checks public HTTPS endpoints with retries:
```bash
curl --fail --retry 10 --retry-delay 3 --retry-max-time 60 https://staging-api.theprimeway.app/api/health
curl --fail --retry 10 --retry-delay 3 --retry-max-time 60 https://staging.theprimeway.app
curl --fail --retry 10 --retry-delay 3 --retry-max-time 60 https://admin.theprimeway.app
```

---

## Environment Variables

Environment variables are managed at two levels:

### Build-time (GitHub Actions → Docker ARG)
Baked into SPA JavaScript bundles. Not secrets — visible in browser.
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_APPLE_CLIENT_ID`
- `VITE_APPLE_REDIRECT_URI`

### Runtime (GitHub Secrets → .env → container env)
Generated by CI from GitHub Secrets, SCP'd to server as `.env`:
- `DOCKER_REGISTRY` — used by docker-compose for image name substitution
- `DATABASE_URL`, `JWT_SECRET`, auth keys, API keys, etc.

The `.env` file serves **dual purpose**:
1. **Docker Compose variable substitution**: `${DOCKER_REGISTRY}` in `docker-compose.prod.yml`
2. **Container environment injection**: `env_file: .env` directive passes vars to containers

See `GITHUB_SECRETS_CHECKLIST.md` for the complete list.

---

## File Layout on Server

```
/var/www/theprimeway/
├── docker-compose.prod.yml    # Copied by deploy job
├── .env                        # Generated from GitHub Secrets
└── nginx/
    ├── theprimeway.conf       # Reverse proxy config (volume-mounted)
    └── spa.conf               # SPA config (only used at image build time)

/etc/letsencrypt/               # SSL certs (managed by Certbot on host)
/var/www/certbot/               # Certbot HTTP-01 challenge webroot
```

---

## Common Operations

### View logs
```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs api --tail 50
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs -f web
```

### Check container status
```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml ps
```

### Force recreate all containers
```bash
cd /var/www/theprimeway
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### Check migration status
```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs migrate
```

### Exec into a container
```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml exec api sh
docker compose -f /var/www/theprimeway/docker-compose.prod.yml exec web ls /usr/share/nginx/html/
```

### Restart a single service
```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml restart api
```

### Rollback to a specific commit
```bash
# Images are tagged by SHA
docker compose -f docker-compose.prod.yml pull  # gets :latest
# Or manually specify a tag in the compose file
```

---

## Security

- **Non-root**: API runs as `hono:nodejs` (uid 1001)
- **Read-only mounts**: SSL certs, certbot webroot, nginx config
- **Internal network**: Only nginx exposes ports to the internet
- **Secrets at runtime**: No secrets in images, all via `.env` at deploy time
- **Base images**: Official `node:22-alpine` and `nginx:alpine`

---

## Troubleshooting

### Container shows `(unhealthy)`
```bash
# Check logs for the specific container
docker compose logs <service> --tail 30

# Verify what's inside
docker compose exec <service> ls /usr/share/nginx/html/  # for web/admin
docker compose exec <service> wget -O - http://localhost/index.html 2>&1 | head -5
```

### 502 Bad Gateway
Nginx can't reach an upstream container. Check:
```bash
docker compose ps  # Is the upstream running?
docker compose logs api  # Is it crash-looping?
docker compose restart nginx  # Refresh upstream DNS
```

### Migration fails
```bash
docker compose logs migrate
# Common: column already exists → use prisma migrate resolve --applied <name>
```

### API crash loop: `Dynamic require of "X" is not supported`
A CJS package was bundled into the ESM output. Add it to `external` in `apps/api/tsup.config.ts`:
```ts
export default defineConfig({
  external: ["dotenv"],  // CJS packages that use require()
})
```

### `.prisma/client/default` not found
Prisma client wasn't generated for the runtime environment. The Dockerfile CMD runs `npx prisma generate` at startup to fix this. If it fails, check:
```bash
docker compose exec api ls node_modules/.prisma/client/
docker compose exec api npx prisma generate
```
