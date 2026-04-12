# ThePrimeWay Deployment Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Repository                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Code (.github/workflows/deploy.yml)                                   │ │
│  │  - Detects changes via dorny/paths-filter                            │ │
│  │  - Runs 3 independent deploy jobs (api, web, admin)                  │ │
│  │  - Reads 29 GitHub Secrets                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└────────────┬───────────────────────────────────────────────────────┬────────┘
             │ (push to main)                                        │
             ▼                                                        ▼
    ┌──────────────────┐                               ┌─────────────────────┐
    │ GitHub Actions   │                               │ Your Secrets Vault  │
    │ Runner           │                               │ (29 GitHub Secrets) │
    │                  │                               │                     │
    │ • pnpm install   │◄──────────────────────────────┤ SSH credentials     │
    │ • Build (tsup)   │                               │ Database URL        │
    │ • Build (Vite)   │                               │ API keys            │
    │ • rsync transfer │                               │ OAuth tokens        │
    └──────────────────┘                               │ ...                 │
             │                                         └─────────────────────┘
             │ (SSH + rsync)
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                         Your VPS Server                              │
    │                   (Ubuntu 20.04+ / Node 22+)                        │
    │                                                                      │
    │ ┌─────────────────────────────────────────────────────────────────┐ │
    │ │ /var/www/theprimeway/                                          │ │
    │ │ ├─ api/              ← PM2 runs: node dist/index.js            │ │
    │ │ ├─ api-next/         ← Staging dir (for atomic swaps)          │ │
    │ │ ├─ api-old/          ← Backup of previous deploy               │ │
    │ │ ├─ web/              ← nginx serves static files                │ │
    │ │ └─ admin/            ← nginx serves static files                │ │
    │ └─────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    │ ┌─────────────────────────────────────────────────────────────────┐ │
    │ │ /var/log/pm2/                                                   │ │
    │ │ ├─ theprimeway-api-error.log                                   │ │
    │ │ └─ theprimeway-api-out.log                                     │ │
    │ └─────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
    │ │   PM2 (fork)     │  │    nginx 443     │  │   PostgreSQL     │  │
    │ │                  │  │   (reverse       │  │                  │  │
    │ │ theprimeway-api  │  │    proxy +       │  │ (local or Neon)  │  │
    │ │                  │  │  static files)   │  │                  │  │
    │ │ Port 3001        │  │                  │  │                  │  │
    │ │                  │  │ api.*.app   ─┐  │  │                  │  │
    │ │                  │  │ app.*.app   ─┼─►:3001                 │  │
    │ │                  │  │ admin.*.app ─┘  │  │                  │  │
    │ └──────────────────┘  └──────────────────┘  └──────────────────┘  │
    └──────────────────────────────────────────────────────────────────────┘
             ▲                                        │
             │ (SSL via Let's Encrypt / Certbot)     │
             │ (Auto-renewed, no manual work)        │
             │                                        ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                     Internet (80/443)                                │
    │                                                                      │
    │ Clients:                                                            │
    │  • https://api.theprimeway.app/api/health     ← Health check       │
    │  • https://api.theprimeway.app/api/auth/...   ← API endpoints     │
    │  • https://app.theprimeway.app                ← Web SPA            │
    │  • https://admin.theprimeway.app              ← Admin SPA          │
    └──────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Flow (per push to main)

### 1. Change Detection (Job: `changes`)
```
GitHub: push to main
        ↓
   Code changes?
        ↓
   ┌─ api/ or packages/shared/ or packages/config-ts/  ► outputs.api = true
   ├─ web/ or packages/shared/ or packages/ui/         ► outputs.web = true
   └─ admin/ or packages/shared/ or packages/ui/       ► outputs.admin = true
```

### 2. API Deployment (conditional job: `deploy-api`)
```
Runs only if outputs.api == 'true'

1. Checkout code
2. Install pnpm + Node 22
3. pnpm install --frozen-lockfile
4. pnpm --filter @repo/api build
   └─ tsup src/index.ts --format esm --dts
      └─ Output: apps/api/dist/
5. pnpm deploy --filter @repo/api --prod /tmp/api-build
   └─ Copies:
      • dist/ (compiled ESM)
      • node_modules/ (production only, no devDependencies)
      • Workspace packages (@repo/shared) inlined into node_modules/@repo/*
6. cp -r apps/api/prisma /tmp/api-build/prisma
   └─ Migration files must travel with the bundle
7. Generate .env from GitHub Secrets
   └─ NODE_ENV=production
      PORT=3001
      DATABASE_URL=***
      [23 other secrets]
   └─ FIREBASE_PRIVATE_KEY: expanded from \n literals to real newlines
8. SSH: Set up key + known_hosts
9. rsync -azP --delete /tmp/api-build/ → deploy@server:/var/www/theprimeway/api-next/
   └─ Transfers flat bundle with prod node_modules
10. SSH: Execute migration + swap + reload
    └─ cd /var/www/theprimeway/api-next
    └─ node_modules/.bin/prisma migrate deploy  ← Run pending migrations
    └─ Atomic swap: api-old ← api ← api-next
    └─ pm2 reload theprimeway-api --update-env   ← Zero-downtime reload
    └─ pm2 save
11. curl https://api.theprimeway.app/api/health  ← Verify it's up
```

**Key design: atomic swap**
- If migration fails, swap doesn't happen → API still running old version
- No downtime: PM2 gracefully reloads (old process gets SIGINT after new one listens)

### 3. Web Deployment (conditional job: `deploy-web`)
```
Runs only if outputs.web == 'true'

1. Checkout, install, setup Node
2. Create apps/web/.env.local from 3 VITE_* secrets
3. pnpm --filter @repo/web build
   └─ tsc --noEmit (type check)
   └─ vite build
      └─ Output: apps/web/dist/ (SPA bundle with content-addressed filenames)
4. rsync -azP --delete apps/web/dist/ → deploy@server:/var/www/theprimeway/web/
5. SSH: nginx -t (syntax check) + sudo systemctl reload nginx
6. curl https://app.theprimeway.app  ← Verify SPA loads
```

**Cache strategy:**
- Vite generates `/assets/index-BxRz1234.js` (content-addressed)
- nginx caches assets with 1-year TTL (`Cache-Control: public, immutable`)
- `index.html` gets `no-cache` so new versions are discovered immediately

### 4. Admin Deployment (conditional job: `deploy-admin`)
```
Same as Web, but deploys to /var/www/theprimeway/admin/
```

---

## Technology Choices & Rationale

### API: Hono + tsup ESM
- **Why ESM?** Node 22 has excellent native ESM support. No CommonJS transpile overhead.
- **Why tsup?** Fast, simple bundler. Outputs clean ESM with source maps.
- **Why PM2 fork mode?** Simple, reliable. Cluster mode only if you need horizontal CPU scaling.

### Web/Admin: Vite SPA
- **Why SPA?** Instant navigation, client-side routing. No SSR complexity.
- **Why content-addressed assets?** Long caching, cache busting via hashes, no version string needed.
- **Why `try_files $uri $uri/ /index.html`?** Client-side routing — all unknown paths serve index.html.

### Deployment: Direct rsync + PM2, no Docker
- **Why?** Simplicity. Containers add complexity without much value for a monolithic app.
- **Why rsync?** Fast, resumable, only transfers deltas (if you re-deploy quickly).
- **Why atomic swap?** Instant rollback if migration fails. Old version keeps serving.

### SSL: Let's Encrypt + Certbot + nginx
- **Why?** Free, automated, industry standard. Certbot handles renewal.
- **Auto-renewal?** Certbot hooks into systemd, renews every 60 days automatically.

### Database: PostgreSQL (local or Neon serverless)
- **Why?** Mature, standard choice for Node.js apps.
- **Neon option?** If you want to avoid DB maintenance, Neon is a managed PostgreSQL.

---

## File Structure in Repo

```
monorepo/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml              ← Main CI/CD workflow
│
├─ nginx/
│  └─ theprimeway.conf           ← nginx configuration
│
├─ apps/
│  ├─ api/
│  │  ├─ ecosystem.config.cjs    ← PM2 config
│  │  ├─ src/
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  └─ migrations/
│  │  └─ dist/                   ← Build output (tsup)
│  │
│  ├─ web/
│  │  ├─ src/
│  │  └─ dist/                   ← Build output (Vite)
│  │
│  └─ admin/
│     ├─ src/
│     └─ dist/                   ← Build output (Vite)
│
├─ packages/
│  ├─ shared/                    ← Workspace package, sources inlined at deploy
│  └─ ui/
│
├─ DEPLOYMENT_SETUP.md           ← Setup instructions
├─ DEPLOYMENT_ARCHITECTURE.md    ← This file
└─ pnpm-workspace.yaml
```

---

## Environment Variables

### Build-time (compile-in)
**Vite apps** (web/admin) — these are embedded in the SPA:
```
VITE_GOOGLE_CLIENT_ID
VITE_APPLE_CLIENT_ID
VITE_APPLE_REDIRECT_URI
```

### Runtime (read from .env)
**API** — all server-side secrets, loaded via dotenv:
```
NODE_ENV                          # production
PORT                              # 3001
DATABASE_URL                      # PostgreSQL connection
JWT_SECRET, JWT_ACCESS_EXPIRY, ... # Auth
AUTH_GOOGLE_*, AUTH_APPLE_*       # OAuth
OPENAI_API_KEY                    # LLM
SMTP_*                            # Email
LEMON_SQUEEZY_*                   # Payments
FIREBASE_*                        # Cloud storage / notifications
CLOUDINARY_*                      # Image hosting
RAPIDAPI_KEY                      # Currency exchange
```

---

## Scaling Considerations

### Horizontal Scaling (Multiple Servers)
If you outgrow a single server:

1. **Load balancer** (nginx, HAProxy, or AWS ELB)
   - Routes traffic across N API servers
   - Health checks each backend

2. **Shared database**
   - PostgreSQL on separate host (or Neon)
   - All API instances connect to same DB

3. **Shared file storage** (if needed)
   - Cloudinary (already used for images)
   - S3 or similar for other assets

4. **Deployment**
   - Deploy to each server sequentially or in parallel
   - Update CI/CD to loop over server list

### Vertical Scaling (Single Server)
Before scaling horizontally:

1. **PM2 cluster mode** — change `instances: 1` → `instances: 'max'`
2. **nginx tuning** — increase `worker_processes`, tune buffers
3. **Database** — optimize queries, add indexes, increase connection pool

---

## Monitoring & Alerts

Add monitoring **after deployment works reliably**:

1. **API health** — `GET /api/health` endpoint exists
2. **nginx logs** — `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
3. **PM2 logs** — `pm2 logs theprimeway-api`
4. **Database** — Connection pool, slow queries
5. **SSL expiry** — Certbot handles automatically, but verify with `certbot renew --dry-run`

Tools to consider:
- **Grafana + Prometheus** — Metrics visualization
- **Sentry** — Error tracking
- **Better Stack / Uptime Robot** — Uptime monitoring
- **Papertrail / CloudWatch** — Log aggregation

---

## Security Checklist

- ✅ All secrets in GitHub, never in code
- ✅ SSH key is deploy-only (consider separate key per server)
- ✅ nginx enforces HTTPS (HTTP → 301 to HTTPS)
- ✅ Security headers set (CSP, X-Frame-Options, HSTS, etc.)
- ✅ API has rate limiting (in Hono middleware, if needed)
- ✅ Database credentials in `.env` (not in code)
- ✅ PM2 logs are readable only by `deploy` user
- ⚠️ *Consider:* IP whitelist for admin panel
- ⚠️ *Consider:* WAF (Web Application Firewall) for DDoS protection

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `ssh: Permission denied (publickey)` | SSH key not authorized | Add public key to `~/.ssh/authorized_keys` on server |
| `prisma migrate deploy` fails | DB credentials wrong or schema conflict | Verify `DATABASE_URL`, check migration file |
| `nginx: [emerg] bind() to 0.0.0.0:443` | Port already in use | Check `sudo lsof -i :443`, kill process if orphaned |
| API slow to start | Node module resolution takes time | Normal for first deploy; next reloads are faster |
| SPA shows old version | Browser cache didn't invalidate | Check that `index.html` has `no-cache` header |
| `pm2 describe theprimeway-api` hangs | PM2 daemon hung | `pm2 kill && pm2 start ecosystem.config.cjs --env production` |

---

## Rollback Procedure

If something breaks after deploy:

```bash
# SSH into server as deploy user

# Option 1: Rollback to previous API version
pm2 stop theprimeway-api
mv /var/www/theprimeway/api /var/www/theprimeway/api-broken
mv /var/www/theprimeway/api-old /var/www/theprimeway/api
pm2 start ecosystem.config.cjs --env production

# Option 2: Rollback to previous web/admin SPA
# (Static files, no version tracking — must restore from Git)
git checkout HEAD~1  # or specific commit
pnpm build --filter @repo/web
rsync -azP apps/web/dist/ deploy@server:/var/www/theprimeway/web/

# Option 3: Nuclear option — restore from backups
# (Requires you to have backups set up)
```

No hay downtime si usas el atomic swap — el servicio sigue con la versión anterior mientras investigas.

---

## Next Steps

1. Read `DEPLOYMENT_SETUP.md` for detailed setup instructions
2. Prepare VPS following the guide
3. Add 29 GitHub Secrets
4. Push to `main` and watch GitHub Actions workflow
5. Verify `https://api.theprimeway.app/api/health` responds
6. Set up monitoring (optional but recommended)
