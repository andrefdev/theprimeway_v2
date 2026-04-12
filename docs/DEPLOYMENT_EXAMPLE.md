# Deployment Example: End-to-End Walkthrough

This document shows a complete example of deploying ThePrimeWay to a production server.

---

## Scenario

You have:
- A fresh Ubuntu 22.04 LTS server at `203.0.113.50`
- SSH access as `root`
- PostgreSQL database externally hosted at `db.example.com:5432`
- Domains registered and pointing to `203.0.113.50`:
  - `api.theprimeway.app`
  - `app.theprimeway.app`
  - `admin.theprimeway.app`

---

## Step 1: Initial Server Setup

```bash
# Connect to server
ssh root@203.0.113.50

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
  docker.io \
  docker-compose-plugin \
  certbot \
  curl \
  git

# Verify versions
docker --version
# Docker version 24.0.x

docker compose version
# Docker Compose version v2.x.x

certbot --version
# certbot 2.x.x

# Create deployment user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# Set password for deploy user (or use SSH keys)
passwd deploy

# Create app directory
mkdir -p /var/www/theprimeway
chown deploy:deploy /var/www/theprimeway

# Create Certbot webroot
mkdir -p /var/www/certbot
chmod 755 /var/www/certbot

# Exit as root
exit
```

---

## Step 2: SSL Certificate Setup

```bash
# SSH as deploy user
ssh deploy@203.0.113.50

# Get SSL certificate for all three domains
# This requires HTTP port 80 to be open
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.theprimeway.app \
  -d app.theprimeway.app \
  -d admin.theprimeway.app \
  --email ops@example.com \
  --agree-tos \
  --non-interactive

# You should see:
# Requesting a certificate for api.theprimeway.app
# Requesting a certificate for app.theprimeway.app
# Requesting a certificate for admin.theprimeway.app
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/api.theprimeway.app/fullchain.pem

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify renewal works
sudo certbot renew --dry-run
# Should output "Congratulations, all renewals succeeded."
```

---

## Step 3: Get Deployment Files

```bash
cd /var/www/theprimeway

# Clone or pull the repository
git clone https://github.com/YOUR_ORG/theprimeway.git repo
cd repo

# Or if you already have it:
git pull origin main

# Copy deployment files
cp docker-compose.prod.yml /var/www/theprimeway/
mkdir -p /var/www/theprimeway/nginx
cp nginx/theprimeway.conf /var/www/theprimeway/nginx/
```

---

## Step 4: Create Environment File

```bash
# Create .env with all secrets
cat > /var/www/theprimeway/.env <<'EOF'
NODE_ENV=production
PORT=3001

# Database (adjust credentials to your setup)
DATABASE_URL=postgresql://appuser:SecurePassword123!@db.example.com:5432/theprimeway

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# Google OAuth (from Google Cloud Console)
AUTH_GOOGLE_ID=123456789.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxx

# Apple OAuth (from Apple Developer)
AUTH_APPLE_ID=com.example.theprimeway
AUTH_APPLE_SECRET=ES256XXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SMTP (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=app-specific-password
SMTP_FROM=noreply@example.com

# Lemon Squeezy (payment processing)
LEMON_SQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
LEMON_SQUEEZY_STORE_ID=12345
LEMON_SQUEEZY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# Firebase
FIREBASE_PROJECT_ID=theprimeway-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@theprimeway-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BA...\n-----END PRIVATE KEY-----\n"

# Cloudinary (image hosting)
CLOUDINARY_CLOUD_NAME=yourcloud
CLOUDINARY_UPLOAD_PRESET=unsigned_preset

# RapidAPI
RAPIDAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF

# Verify the file is created
ls -la /var/www/theprimeway/.env
chmod 600 /var/www/theprimeway/.env
```

---

## Step 5: Start Docker Compose

```bash
cd /var/www/theprimeway

# Export Docker registry (GitHub username with lowercase)
export DOCKER_REGISTRY=yourorgname

# Pull Docker images from GHCR
docker compose -f docker-compose.prod.yml pull

# Expected output:
# Pulling nginx (nginx:alpine)...
# Pulling migrate (ghcr.io/yourorgname/theprimeway-api:latest)...
# Pulling api (ghcr.io/yourorgname/theprimeway-api:latest)...
# Pulling web (ghcr.io/yourorgname/theprimeway-web:latest)...
# Pulling admin (ghcr.io/yourorgname/theprimeway-admin:latest)...

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Expected output:
# [+] Running 5/5
#  ✔ Container theprimeway-migrate-1     Exited (0)
#  ✔ Container theprimeway-nginx-1       Started
#  ✔ Container theprimeway-api-1         Started
#  ✔ Container theprimeway-web-1         Started
#  ✔ Container theprimeway-admin-1       Started
```

---

## Step 6: Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Expected:
# NAME                     COMMAND                  SERVICE   STATUS           PORTS
# theprimeway-admin-1      "nginx -g 'daemon off" admin     Up 2 minutes
# theprimeway-api-1        "node dist/index.js"    api       Up 2 minutes
# theprimeway-migrate-1    "sh -c 'node_modules/...' migrate  Exited (0) 2 minutes
# theprimeway-nginx-1      "nginx -g 'daemon off"  nginx     Up 2 minutes
# theprimeway-web-1        "nginx -g 'daemon off"  web       Up 2 minutes

# View logs
docker compose -f docker-compose.prod.yml logs api

# Expected (excerpt):
# theprimeway-api-1 | [2024-XX-XX 10:12:34] Hono server running on port 3001
# theprimeway-api-1 | [2024-XX-XX 10:12:35] Database connected

# Test API health endpoint
curl https://api.theprimeway.app/api/health

# Expected response:
# {"status":"ok"}

# Test Web SPA loads
curl -I https://app.theprimeway.app

# Expected (first few headers):
# HTTP/2 200
# content-type: text/html; charset=utf-8
# cache-control: no-cache, no-store, must-revalidate
```

---

## Step 7: GitHub Actions Automatic Deployment

Now that the server is set up, push code to trigger GitHub Actions:

```bash
# From your local machine
git add .
git commit -m "Deploy ThePrimeWay with Docker"
git push origin main
```

GitHub Actions will:
1. Detect changes to `apps/api/`, `apps/web/`, `apps/admin/`
2. Build Docker images on runners
3. Push to GHCR
4. SSH to your server
5. Pull new images
6. Restart containers
7. Run health checks

**To monitor the deployment:**
- Go to GitHub repo → Actions tab
- Click the latest workflow run
- Watch the steps execute
- Check logs for errors

---

## Step 8: Post-Deployment Monitoring

```bash
# Check container health status
docker compose -f docker-compose.prod.yml ps --format "table {{.Service}}\t{{.Status}}"

# Check disk usage
df -h /var/www/theprimeway

# Monitor logs in real-time
docker compose -f docker-compose.prod.yml logs -f api

# Check certificate expiration
sudo certbot certificates

# Expected:
# - api.theprimeway.app (70 days left)
```

---

## Step 9: Set Up Monitoring (Recommended)

### Health Check Monitoring

```bash
# Add to your monitoring service (e.g., Uptime Robot)
Endpoint: https://api.theprimeway.app/api/health
Expected: {"status":"ok"}
Interval: 5 minutes
```

### Docker Resource Monitoring

```bash
# Monitor container resource usage
docker stats --no-stream

# Expected output shows CPU, memory, etc.
```

---

## Troubleshooting Example Issues

### Issue: API container keeps restarting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs api

# If DATABASE_URL is wrong, you'll see:
# Error: ECONNREFUSED - could not connect to server

# Fix: Update .env with correct DATABASE_URL
nano /var/www/theprimeway/.env

# Restart API
docker compose -f docker-compose.prod.yml restart api

# Verify
docker compose -f docker-compose.prod.yml ps
```

### Issue: SSL certificate errors

```bash
# Check certificate status
sudo ls -la /etc/letsencrypt/live/api.theprimeway.app/

# If missing, issue new cert:
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.theprimeway.app

# Restart nginx to use new cert
docker compose -f docker-compose.prod.yml restart nginx
```

### Issue: Cannot access web app

```bash
# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx

# If you see "upstream timed out":
# The web container may not be healthy
docker compose -f docker-compose.prod.yml logs web

# Restart it
docker compose -f docker-compose.prod.yml restart web
```

---

## Production Readiness Checklist

- [ ] All three domains resolve to server IP
- [ ] HTTPS works without warnings
- [ ] API health check returns `{"status":"ok"}`
- [ ] Web SPA loads at `https://app.theprimeway.app`
- [ ] Admin panel loads at `https://admin.theprimeway.app`
- [ ] Database migrations completed successfully
- [ ] All environment variables set correctly
- [ ] Docker containers have restart policies
- [ ] Firewall rules allow 80, 443, SSH only
- [ ] SSL certificate auto-renewal enabled
- [ ] Monitoring/alerts configured
- [ ] Backups of `.env` file in secure location
- [ ] Team has access to server and deployment procedures

---

## Rollback Procedure

If a new deployment causes issues:

```bash
# View image history
docker image ls | grep theprimeway

# Use the previous image tag
export DOCKER_REGISTRY=yourorgname

# Edit docker-compose.prod.yml to pin to previous commit hash
# e.g., image: ghcr.io/yourorgname/theprimeway-api:abc123def (previous commit)

# Or use the latest stable tag if you've tagged releases:
# image: ghcr.io/yourorgname/theprimeway-api:v1.2.3

# Then restart
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Verify old version is running
curl https://api.theprimeway.app/api/health
```

---

## Next Deployment

For subsequent deployments, just push to `main`:

```bash
git add .
git commit -m "Fix: API response handling"
git push origin main

# GitHub Actions handles the rest!
# (or manually run: docker compose pull && docker compose up -d)
```
