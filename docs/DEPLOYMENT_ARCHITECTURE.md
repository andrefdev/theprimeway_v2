# ThePrimeWay Deployment Architecture

## Overview

ThePrimeWay uses **Docker Compose** for production deployment. Each service (API, Web SPA, Admin SPA) runs in its own container, orchestrated by Docker Compose on the production server.

- **Container Registry**: GitHub Container Registry (GHCR) — free, integrated with GitHub Actions
- **Server Setup**: Single Linux server (Ubuntu 22.04+) running Docker Engine + Docker Compose plugin
- **SSL/TLS**: Certbot running on the host (manages certificates in `/etc/letsencrypt`)
- **Reverse Proxy**: Nginx container routes incoming traffic to backend services

---

## Services Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internet (HTTPS 443, HTTP 80)               │
│                                                                 │
│    ┌──────────────────────────────────────────────────────┐    │
│    │                 Nginx (Reverse Proxy)                │    │
│    │         - SSL/TLS Termination (Let's Encrypt)       │    │
│    │         - Routes to backend services                 │    │
│    │         - Health checks                              │    │
│    └──────────────┬──────────────┬──────────────┬─────────┘    │
│                   │              │              │               │
│    ┌──────────────▼──┐ ┌────────▼──────┐ ┌──────▼──────┐       │
│    │   api:3001      │ │   web:80      │ │  admin:80   │       │
│    │   (Hono API)    │ │  (Vite SPA)   │ │ (Vite SPA)  │       │
│    │                 │ │  (nginx)      │ │  (nginx)    │       │
│    └────────┬────────┘ └───────────────┘ └─────────────┘       │
│             │                                                   │
│    ┌────────▼────────┐      ┌─────────────────────────┐        │
│    │   migrate       │      │  Docker Internal Network │        │
│    │   (init container)    │   (theprimeway-net)      │        │
│    └─────────────────┘      └─────────────────────────┘        │
│             │                                                   │
│    ┌────────▼────────┐                                          │
│    │  PostgreSQL DB  │                                          │
│    │  (External)     │                                          │
│    └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        (Docker Compose on Linux Server)
```

---

## Service Details

### Migrate Service
- **Image**: `ghcr.io/{owner}/theprimeway-api:latest`
- **Purpose**: Initialization container that runs database migrations before the API starts
- **Behavior**: 
  - Runs `prisma migrate deploy` once
  - Exits after completing (restart: no)
  - Does not expose any ports
- **Dependency**: Database must be accessible via `DATABASE_URL`

### API Service
- **Image**: `ghcr.io/{owner}/theprimeway-api:latest`
- **Language**: Node.js 22 + Hono v4.7
- **Port**: 3001 (internal, exposed only to nginx via Docker network)
- **Environment**: `.env` file injected via `env_file: .env`
- **Key Variables**:
  - `DATABASE_URL` — PostgreSQL connection string
  - `JWT_SECRET` — JWT signing key
  - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — OAuth
  - `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY` — Firebase integration
  - (See `GITHUB_SECRETS_CHECKLIST.md` for complete list)
- **Healthcheck**: Polls `/api/health` every 30s
- **Dependency**: `migrate` service must complete successfully before API starts

### Web Service
- **Image**: `ghcr.io/{owner}/theprimeway-web:latest`
- **Build**: Multi-stage — Node.js builder + Nginx runtime
- **Port**: 80 (internal)
- **Build-time Args** (baked into bundle):
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_APPLE_CLIENT_ID`
  - `VITE_APPLE_REDIRECT_URI`
- **SPA Routing**: Nginx serves Vite-compiled bundle with client-side routing fallback
- **Caching**:
  - Hashed assets (`/assets/*.hash.js|css`) → 1-year TTL
  - `index.html` → no-cache (always fetch latest)

### Admin Service
- **Image**: `ghcr.io/{owner}/theprimeway-admin:latest`
- **Build**: Identical to web (separate admin SPA)
- **Port**: 80 (internal)
- **Build-time Args**: Same as web
- **Note**: Could be restricted by IP in nginx config if needed

### Nginx Service
- **Image**: `nginx:alpine`
- **Ports**: 
  - 80 → HTTP (redirects to HTTPS)
  - 443 → HTTPS (SSL-terminated)
- **Volumes**:
  - `/etc/letsencrypt/` (read-only) — SSL certificates from host
  - `certbot-webroot` → `/var/www/certbot` (read-only) — Certbot challenge directory
  - `nginx/theprimeway.conf` → `/etc/nginx/conf.d/default.conf` — Reverse proxy config
- **Upstreams**:
  - `http://api:3001` — Hono API
  - `http://web:80` — Web SPA
  - `http://admin:80` — Admin SPA
- **SSL**: Pre-configured by Certbot on host; Nginx reads certs from mounted volume
- **Healthcheck**: Polls `http://localhost:80/` every 30s

---

## Docker Network

All services connect to an internal bridge network named `theprimeway-net`:
- Services communicate by hostname (e.g., `http://api:3001`)
- No direct internet exposure (only Nginx has ports exposed)
- Automatic DNS resolution via Docker's embedded resolver

---

## Database Migrations

Migrations run **before** the API starts:
1. `docker-compose up -d` is called
2. Docker starts the `migrate` service
3. `migrate` runs `prisma migrate deploy` and exits
4. Docker starts the `api` service with `depends_on: [migrate] condition: service_completed_successfully`
5. API is fully operational with schema in place

This eliminates the need to manually run migrations on the server.

---

## SSL/TLS with Certbot

Certbot runs on the **host** (not in Docker):
1. Initially: `sudo certbot certonly --webroot -d api.theprimeway.app -d app.theprimeway.app -d admin.theprimeway.app`
2. Certificates stored in `/etc/letsencrypt/live/`
3. Nginx container mounts `/etc/letsencrypt` as read-only
4. Certbot auto-renewal (cron job on host): reads `/.well-known/acme-challenge/` from certbot-webroot volume
5. No container restart needed for renewal — Nginx continues to serve updated certs

---

## Zero-Downtime Deployment

When pushing new code:
1. GitHub Actions builds new Docker images and pushes to GHCR
2. Deployment job SSHes to server and runs:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
3. Docker pulls new images (if changed) and recreates only affected containers
4. Services with `restart: unless-stopped` restart gracefully
5. Health checks ensure readiness before considering deployment done

**Key**: No data loss, no downtime for unchanged services.

---

## File Locations on Server

```
/var/www/theprimeway/
├── docker-compose.prod.yml    # Orchestration config (copied by deploy job)
├── .env                        # Environment variables (generated by deploy job)
├── nginx/
│   ├── spa.conf               # (In repo, used by web/admin containers)
│   └── theprimeway.conf       # (In repo, used by nginx container)
└── (Docker volumes managed by Docker — data persists across restarts)
```

---

## Security Considerations

1. **Non-root user**: API container runs as `hono:nodejs` (uid:1001) — not root
2. **Read-only mounts**: SSL certificates and Certbot webroot mounted read-only
3. **Internal network**: Services communicate privately; only Nginx exposed to internet
4. **Secrets**: All sensitive values (DB credentials, API keys) injected at runtime via `.env`
5. **Image security**: Built from official base images (node:22-alpine, nginx:alpine)

---

## Logging

All containers log to Docker's JSON file driver:
- **Location on host**: `/var/lib/docker/containers/<container-id>/<container-id>-json.log`
- **Rotation**: Max 10MB per file, max 3 files per container
- **Access**: `docker compose logs <service>` or `docker logs <container>`

Example:
```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs -f api
```

---

## Health Checks

Each service includes a healthcheck:
- **Interval**: 30s
- **Timeout**: 10s
- **Start period**: 15s (grace period before first check)
- **Retries**: 3 failures before marking unhealthy

Docker Compose uses these to determine startup order and signal container health.
