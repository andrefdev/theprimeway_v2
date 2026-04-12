# Deployment Example: Full Walkthrough

## Scenario

You've just fixed a bug in the API and you're ready to deploy it to production.

```bash
# Your local machine
$ git add apps/api/src/routes/auth.ts
$ git commit -m "fix: handle expired tokens correctly"
$ git push origin main
```

Here's what happens automatically behind the scenes:

---

## Step 1: GitHub Detects Push (Instant)

```
GitHub Webhook → GitHub Actions
  
Event: push to main branch
Status: Triggered ✓
```

Your workflow `.github/workflows/deploy.yml` starts running.

---

## Step 2: Change Detection (~10 seconds)

```yaml
# Job: changes

What changed?
  ├─ apps/api/src/routes/auth.ts  ✓ (modified)
  ├─ packages/shared/**           ✗ (no change)
  ├─ packages/config-ts/**        ✗ (no change)
  └─ packages/ui/**               ✗ (no change)

Result:
  ✓ api=true      (deploy-api job will run)
  ✗ web=false     (deploy-web job skipped)
  ✗ admin=false   (deploy-admin job skipped)
```

GitHub Actions decides to run only `deploy-api`. The `deploy-web` and `deploy-admin` jobs are skipped, saving time and build minutes.

---

## Step 3: Build API (~60 seconds)

```yaml
# Job: deploy-api (conditional, runs because api=true)

Steps:
  1. Checkout code
     → git clone + git fetch main
     
  2. Setup pnpm + Node 22
     → Restores pnpm cache (fast if unchanged)
     
  3. Install dependencies
     → pnpm install --frozen-lockfile
     → (skipped if cache hit)
     
  4. Build API
     → pnpm --filter @repo/api build
     → Runs: tsup src/index.ts --format esm --dts
     → Output: apps/api/dist/index.js (+ source maps)
     
  5. Create deployment bundle
     → pnpm deploy --filter @repo/api --prod /tmp/api-build
     → Copies: dist/ + node_modules/ + @repo/shared/ sources
     → Size: ~150 MB
     
  6. Copy Prisma schema
     → cp -r apps/api/prisma /tmp/api-build/prisma
     → Migrations needed at deploy time
```

**Bundle structure (on CI runner):**
```
/tmp/api-build/
├─ dist/
│  └─ index.js           (compiled ESM)
├─ node_modules/
│  ├─ hono/
│  ├─ @prisma/
│  ├─ pg/
│  └─ @repo/
│     └─ shared/         (workspace package, inlined)
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
│     ├─ 20260101000000_init/
│     └─ ...
└─ .env                  (generated from GitHub Secrets)
```

---

## Step 4: Generate .env (15 seconds)

```bash
# From GitHub Secrets (29 total)

Secrets retrieved:
  SSH_HOST = deploy.example.com
  SSH_USER = deploy
  DATABASE_URL = postgresql://...
  JWT_SECRET = ******* (masked in logs)
  JWT_ACCESS_EXPIRY = 7d
  AUTH_GOOGLE_ID = ******* (masked)
  ... (23 more secrets)

Generate .env file:
  NODE_ENV=production
  PORT=3001
  DATABASE_URL=postgresql://theprimeway:***@db.neon.tech/theprimeway_prod
  JWT_SECRET=***
  JWT_ACCESS_EXPIRY=7d
  ... (26 more lines)

⚠️ Special handling for FIREBASE_PRIVATE_KEY:
   Raw:      -----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
   Expanded: -----BEGIN PRIVATE KEY-----
             MIIEv...
             -----END PRIVATE KEY-----
   
   (printf '%b' converts \n to real newlines)

Write to: /tmp/api-build/.env
```

GitHub Actions masks all secrets in logs, so you'll see `***` instead of actual values.

---

## Step 5: SSH Setup & Transfer (~30 seconds)

```bash
# Setup SSH

1. Create ~/.ssh/id_rsa from SSH_PRIVATE_KEY secret
2. Set permissions: chmod 600 ~/.ssh/id_rsa
3. Populate known_hosts:
   ssh-keyscan -p 22 -H deploy.example.com >> ~/.ssh/known_hosts

# Transfer via rsync

rsync -azP --delete \
  -e "ssh -p 22" \
  /tmp/api-build/ \
  deploy@deploy.example.com:/var/www/theprimeway/api-next/

Transfer summary:
  ✓ Building file list ... done
  ✓ Transferred 150 MB in 8 seconds (18.75 MB/s)
  ✓ Total: 2,347 files (dist/, node_modules/, prisma/)
```

Files are synced to `/var/www/theprimeway/api-next/` (staging directory) on the server.

---

## Step 6: Migrations & Swap (~15 seconds)

```bash
# SSH into server as deploy user

$ cd /var/www/theprimeway/api-next
$ node_modules/.bin/prisma migrate deploy

Prisma migration output:
  ✓ No migration files to run. Database is in sync.
  (or)
  ✓ 1 migration found
  ✓ Running migration `20260401120000_fix_auth_token_expiry`
  ✓ Migration completed in 234ms

# Atomic swap

$ rm -rf /var/www/theprimeway/api-old
$ mv /var/www/theprimeway/api /var/www/theprimeway/api-old
$ mv /var/www/theprimeway/api-next /var/www/theprimeway/api

# Reload PM2 (graceful restart)

$ pm2 describe theprimeway-api > /dev/null 2>&1
  (exists, so reload rather than start fresh)

$ pm2 reload theprimeway-api --update-env

PM2 reload output:
  ✓ Reloading app in cluster mode...
  ✓ Received signal SIGINT (app 0)
  ✓ App started (PID 9247)
  ✓ Done
  ✓ App 0: ID 0, Name "theprimeway-api"
```

**What just happened:**
- Old process (running old code) receives SIGINT
- New process spawns from new code in `/var/www/theprimeway/api`
- All new HTTP requests go to new process
- Old process exits gracefully after in-flight requests complete
- **Zero downtime**

---

## Step 7: Health Check (5 seconds)

```bash
# Final verification

$ sleep 5  (wait for PM2 to settle)

$ curl --fail --retry 5 --retry-delay 3 https://api.theprimeway.app/api/health

Response:
  HTTP/1.1 200 OK
  Content-Type: application/json
  
  {
    "status": "ok",
    "timestamp": "2026-04-12T10:15:23.456Z",
    "uptime": 42
  }

Health check result: ✓ PASS
```

---

## Step 8: GitHub Actions Complete (Log Summary)

```
Workflow run completed successfully!

Job summary:
  ✓ changes              (10 sec)  Detected: api=true, web=false, admin=false
  ✓ deploy-api           (160 sec) API built, deployed, migrated, reloaded
  ✗ deploy-web           (skipped) No changes detected
  ✗ deploy-admin         (skipped) No changes detected

Total time: ~3 minutes
Build minutes used: ~2.5
Cost: ~$0.01 (assuming $0.008 per minute)

Logs available at: https://github.com/user/theprimeway/actions/runs/XXXXX
```

Your browser shows a green checkmark. The deploy is done.

---

## What the User Sees

```
Timeline:

10:10:00 - Push commit to GitHub
10:10:05 - GitHub Actions starts (user gets notification)
10:10:15 - Change detection complete
10:10:20 - Build starts
10:11:20 - Build complete, rsync starting
10:11:50 - Transfer complete
10:12:00 - Migrations running
10:12:10 - API reloaded
10:12:15 - Health check passes
10:12:15 - Deploy complete ✓

Total time: ~2 minutes
```

While the deploy is happening, the **old API is still running** (no downtime).

---

## If Something Goes Wrong

### Scenario: Migration Fails

```bash
# During "Run migrations and restart PM2" step

$ cd /var/www/theprimeway/api-next
$ node_modules/.bin/prisma migrate deploy

Error:
  Migration `20260401120000_fix_auth_token_expiry` failed
  Error: Timeout waiting for schema lock
  
  (or any other DB error)

Result:
  ✗ Migration failed
  → Swap is skipped
  → API still running old code
  → Old version continues serving traffic
  
GitHub Actions output:
  ✗ Deploy failed
  └─ User gets notification
  └─ Full error in logs

Recovery:
  1. SSH into server
  2. Debug the migration issue
  3. Fix schema.prisma or migration file
  4. Push fix to GitHub
  5. Re-deploy (workflow triggers automatically)
```

The atomic swap ensures **no bad code is ever deployed**. You can take your time debugging without affecting live users.

---

### Scenario: Health Check Fails

```bash
$ curl https://api.theprimeway.app/api/health
curl: (7) Failed to connect to api.theprimeway.app port 443: Connection timed out

Or:
  HTTP/1.1 500 Internal Server Error

GitHub Actions logs:
  ✗ Health check failed after 5 retries
  Workflow marked as FAILED

What to do:
  1. SSH into server: pm2 logs theprimeway-api
  2. Check error logs: tail -f /var/log/pm2/theprimeway-api-error.log
  3. If it's a startup issue, check .env: cat /var/www/theprimeway/api/.env
  4. Fix and push again, or rollback manually
```

---

## Rollback if Needed

```bash
# SSH into server as deploy user

# Option 1: Swap back to previous version
$ pm2 stop theprimeway-api
$ mv /var/www/theprimeway/api /var/www/theprimeway/api-broken
$ mv /var/www/theprimeway/api-old /var/www/theprimeway/api
$ pm2 start ecosystem.config.cjs --env production

# Option 2: Restart from git if you have CI artifacts
$ cd /var/www/theprimeway/api
$ pm2 reload theprimeway-api

# Verify
$ curl https://api.theprimeway.app/api/health
```

Rollback is instant (seconds).

---

## Monitoring Post-Deploy

```bash
# SSH into server

# Check PM2 status
$ pm2 status
# Should show theprimeway-api with status "online"

# Check recent logs
$ pm2 logs theprimeway-api --lines 50

# Check nginx
$ tail -f /var/log/nginx/access.log | grep api.theprimeway.app

# Check memory usage
$ pm2 monit
```

---

## Multiple Changes Example

Now imagine you push changes to both API and web:

```bash
$ git add apps/api/src/routes/health.ts apps/web/src/components/Layout.tsx
$ git commit -m "fix: improve health endpoint and UI layout"
$ git push origin main
```

**Workflow execution:**

```
Change detection:
  ✓ api=true   (apps/api changed)
  ✓ web=true   (apps/web changed)
  ✗ admin=false

Run jobs in parallel:
  deploy-api [████████████] 160 sec → Deploy & reload PM2
  deploy-web [████████████]  90 sec → rsync & nginx reload

Both complete independently, no race conditions.
Result: All 3 services updated in ~160 seconds (not 250).
```

---

## That's It!

From a simple `git push` to production deployment in **~2 minutes**, with:
- ✓ Automated builds
- ✓ Zero downtime
- ✓ Automatic rollback on failure
- ✓ Database migrations
- ✓ Health checks
- ✓ Detailed logs

All managed by GitHub Actions + one nginx + one PM2 instance.

**No manual deploys. No DevOps overhead. Just push and watch.**
