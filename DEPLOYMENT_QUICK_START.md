# Deployment Quick Start

Created: April 2026  
Status: Ready to implement

## What's Been Set Up

You now have a **complete, production-ready CI/CD pipeline** for ThePrimeWay. Here's what was generated:

### Files Created (4 files)

1. **`.github/workflows/deploy.yml`** (360 lines)
   - GitHub Actions workflow
   - Change detection with `dorny/paths-filter`
   - 3 parallel deploy jobs (api, web, admin)
   - Handles 29 GitHub Secrets safely
   - Prisma migrations + atomic swap for API
   - Health checks after each deploy

2. **`nginx/theprimeway.conf`** (170 lines)
   - 3 server blocks (api, app, admin)
   - HTTP → HTTPS redirects
   - SSL placeholders for Certbot
   - Gzip compression
   - Security headers (CSP, HSTS, X-Frame-Options, etc.)
   - SPA routing with content-addressed asset caching
   - Proper proxy headers for API

3. **`apps/api/ecosystem.config.cjs`** (40 lines)
   - PM2 configuration for production
   - Fork mode (single process)
   - Memory limits and restart policies
   - Logging configuration
   - Source maps enabled for debugging

4. **Documentation (4 guides)**
   - `DEPLOYMENT_SETUP.md` — Step-by-step server setup
   - `DEPLOYMENT_ARCHITECTURE.md` — System design, flows, rationale
   - `GITHUB_SECRETS_CHECKLIST.md` — All 29 secrets and how to get each
   - `DEPLOYMENT_QUICK_START.md` — This file

---

## Next Steps (In Order)

### Phase 1: Server Preparation (30–60 minutes)

Your VPS needs:
- Ubuntu 20.04+ (or Debian equivalent)
- Node.js 22+
- pnpm 9.12.2
- PostgreSQL (or Neon serverless)
- nginx
- PM2

**Do this once per server:**

```bash
# 1. Create directories
sudo mkdir -p /var/www/theprimeway/{api,api-next,api-old,web,admin} /var/log/pm2
sudo chown -R deploy:deploy /var/www/theprimeway /var/log/pm2

# 2. Install nginx + certbot
sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx

# 3. Copy nginx config
sudo cp nginx/theprimeway.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/theprimeway.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Setup PM2
sudo npm install -g pm2@latest
pm2 startup   # follow the sudo command it prints
pm2 save

# 5. Sudoers for nginx
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/sbin/nginx -t" \
  | sudo tee /etc/sudoers.d/deploy-nginx
```

See **`DEPLOYMENT_SETUP.md`** for full details (sections 1.1–1.6).

### Phase 2: GitHub Secrets Configuration (20–30 minutes)

Add 29 secrets to your GitHub repository:

**Repository → Settings → Secrets and variables → Actions**

Required secrets grouped by category:
- **Infrastructure:** SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, SSH_PORT
- **Database:** DATABASE_URL
- **Auth:** JWT_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY, AUTH_GOOGLE_*, AUTH_APPLE_*
- **APIs:** OPENAI_API_KEY, RAPIDAPI_KEY
- **Email:** SMTP_*
- **Payments:** LEMON_SQUEEZY_*
- **Firebase:** FIREBASE_*
- **Cloudinary:** CLOUDINARY_*
- **Frontend:** VITE_GOOGLE_CLIENT_ID, VITE_APPLE_CLIENT_ID, VITE_APPLE_REDIRECT_URI

See **`GITHUB_SECRETS_CHECKLIST.md`** for where to get each secret and exact format.

### Phase 3: SSL Certificate (10 minutes, once)

After DNS is pointing at your VPS:

```bash
sudo certbot --nginx \
  -d api.theprimeway.app \
  -d app.theprimeway.app \
  -d admin.theprimeway.app
```

Certbot will:
- Auto-edit `nginx/theprimeway.conf` with SSL directives
- Setup auto-renewal (runs via systemd, no manual work)

### Phase 4: Test Deploy (5 minutes)

```bash
# Make a trivial change and push to main
git add .
git commit -m "Setup: add CI/CD pipeline and nginx config"
git push origin main

# Watch at: GitHub → Actions → Deploy workflow
```

Once deploy finishes, verify:
```bash
curl https://api.theprimeway.app/api/health
curl https://app.theprimeway.app
curl https://admin.theprimeway.app
```

Should all respond with 200 OK.

---

## Architecture at a Glance

```
Push to main
    ↓
GitHub Actions detects changes (dorny/paths-filter)
    ├─ api/**       → deploy-api job
    ├─ web/**       → deploy-web job
    └─ admin/**     → deploy-admin job
    ↓
Build (pnpm + tsup for API, pnpm + Vite for SPAs)
    ↓
rsync to VPS staging directories
    ↓
SSH: Run migrations + swap + reload
    ├─ API: prisma migrate deploy → atomic swap → pm2 reload (zero downtime)
    └─ Web/Admin: nginx -t → systemctl reload
    ↓
Health checks
    └─ curl /api/health, https://app.theprimeway.app, etc.
```

No Docker. Direct Node.js. 29 secrets injected at build time. Atomic rollback if migrations fail.

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **No Docker** | Simpler, faster deploys, easier to troubleshoot |
| **rsync not SCP** | Fast, resumable, only transfers deltas |
| **Atomic swap (api-next → api)** | Instant rollback if migration fails, zero downtime |
| **PM2 fork mode** | Simple, reliable; cluster mode only if you need horizontal scaling |
| **pnpm deploy --prod** | Self-contained bundle with node_modules, workspace deps inlined |
| **nginx + Certbot** | Free SSL, auto-renewed, industry standard |
| **Content-addressed assets (Vite)** | Browser caches forever, new versions auto-discovered via index.html |

---

## Monitoring & Maintenance

After deployment works reliably, consider adding:

- **Uptime monitoring:** Uptime Robot, Better Stack
- **Error tracking:** Sentry
- **Metrics/dashboards:** Grafana + Prometheus
- **Log aggregation:** Papertrail, CloudWatch

For now, you can monitor manually:
```bash
# SSH into server
pm2 logs theprimeway-api
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting Reference

**"Permission denied" on SSH**
- Verify public key in server's `~/.ssh/authorized_keys`
- Check SSH_USER exists

**"prisma migrate deploy" fails**
- Verify DATABASE_URL is correct
- Check DB schema is compatible with migration

**SPA shows old version**
- Check browser cache (index.html should have `no-cache` header)
- Verify nginx config has the cache-control directives

**API doesn't start**
- Check PM2 logs: `pm2 logs theprimeway-api`
- Verify `.env` file exists at `/var/www/theprimeway/api/.env`
- Check `pm2 describe theprimeway-api`

See **`DEPLOYMENT_SETUP.md`** Troubleshooting section for more.

---

## Files at a Glance

### Core Deployment Files
- `.github/workflows/deploy.yml` — Main CI/CD workflow
- `nginx/theprimeway.conf` — nginx configuration
- `apps/api/ecosystem.config.cjs` — PM2 configuration

### Documentation
- `DEPLOYMENT_SETUP.md` — ⭐ Read this first for server setup
- `DEPLOYMENT_ARCHITECTURE.md` — System design & rationale
- `GITHUB_SECRETS_CHECKLIST.md` — All secrets with sources
- `DEPLOYMENT_QUICK_START.md` — This file

---

## Checklist to Go Live

- [ ] Read `DEPLOYMENT_SETUP.md` sections 1.1–1.5
- [ ] Prepare VPS (directories, nginx, PM2, sudoers)
- [ ] Point DNS to VPS
- [ ] Run Certbot for SSL
- [ ] Create 29 GitHub Secrets (use `GITHUB_SECRETS_CHECKLIST.md`)
- [ ] Make a test push to `main`
- [ ] Watch GitHub Actions → Deploy workflow
- [ ] Verify health checks:
  - `curl https://api.theprimeway.app/api/health`
  - `curl https://app.theprimeway.app`
  - `curl https://admin.theprimeway.app`
- [ ] ✅ You're live!

---

## Support

For each step, refer to:

1. **Server setup?** → `DEPLOYMENT_SETUP.md`
2. **How does it work?** → `DEPLOYMENT_ARCHITECTURE.md`
3. **What secrets do I need?** → `GITHUB_SECRETS_CHECKLIST.md`
4. **Something broke?** → Troubleshooting sections in the docs

---

## That's It!

You now have a **professional, zero-downtime deployment pipeline** ready to go.

Next time you push to `main`:
- GitHub Actions automatically builds
- Deploys to your VPS
- Runs database migrations safely
- Keeps your API running the whole time
- Health checks confirm everything is working

**No manual deploys. No downtime. No Docker complexity.**

Good luck! 🚀
