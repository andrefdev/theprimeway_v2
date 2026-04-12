# Quick Start: Deploy ThePrimeWay

This is the **fast path** to get ThePrimeWay running. For detailed explanations, see `DEPLOYMENT_SETUP.md`.

---

## TL;DR (Already Have a Server Set Up?)

```bash
# SSH to server
ssh deploy@your-server-ip

# Pull latest code
cd /var/www/theprimeway
export DOCKER_REGISTRY=your-github-username

# Pull images and start
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Verify
docker compose ps
curl https://api.theprimeway.app/api/health
```

---

## First-Time Setup

### 1. Prepare Server (One-Time)

```bash
# SSH to your Ubuntu 22.04+ server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
apt install -y docker.io docker-compose-plugin certbot

# Create deploy user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# Create deployment directory
mkdir -p /var/www/theprimeway
chown -R deploy:deploy /var/www/theprimeway

# Create certbot webroot for SSL renewal
mkdir -p /var/www/certbot

# Exit as root
exit
```

### 2. Set Up SSL Certificate

```bash
# SSH as deploy user
ssh deploy@your-server-ip

# Issue certificate (replace domains if needed)
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.theprimeway.app \
  -d app.theprimeway.app \
  -d admin.theprimeway.app \
  --email your-email@example.com \
  --agree-tos --non-interactive

# Enable auto-renewal
sudo systemctl enable --now certbot.timer
```

### 3. Deploy Code (Automated via GitHub Actions)

Push to `main` branch:

```bash
git add .
git commit -m "Deploy to Docker"
git push origin main
```

GitHub Actions will:
1. Build Docker images
2. Push to GHCR
3. SSH to server and pull images
4. Start containers

**Or deploy manually:**

```bash
ssh deploy@your-server-ip

cd /var/www/theprimeway

# Copy .env (you created this from GITHUB_SECRETS_CHECKLIST.md)
# Either manually create it or have GitHub Actions copy it

# Copy docker-compose config
curl -O https://raw.githubusercontent.com/YOUR_ORG/theprimeway/main/docker-compose.prod.yml
mkdir -p nginx
curl https://raw.githubusercontent.com/YOUR_ORG/theprimeway/main/nginx/theprimeway.conf \
  -o nginx/theprimeway.conf

# Start
export DOCKER_REGISTRY=your-github-username
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Verify
docker compose ps
```

### 4. Verify Everything Works

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# Test API
curl https://api.theprimeway.app/api/health

# Test Web
curl https://app.theprimeway.app | head -20

# View logs
docker compose -f docker-compose.prod.yml logs api
```

---

## Common Commands

```bash
# View status
docker compose -f /var/www/theprimeway/docker-compose.prod.yml ps

# View logs (real-time)
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs -f api

# Restart API
docker compose -f /var/www/theprimeway/docker-compose.prod.yml restart api

# Update and restart all
cd /var/www/theprimeway
export DOCKER_REGISTRY=your-username
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# SSH into API container
docker compose -f /var/www/theprimeway/docker-compose.prod.yml exec api /bin/sh

# View database migrations status
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs migrate
```

---

## Environment Variables

Create `.env` file in `/var/www/theprimeway/`:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@db-host:5432/theprimeway

# Auth
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# Google OAuth
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=xxx

# Apple OAuth
AUTH_APPLE_ID=com.example.theprimeway
AUTH_APPLE_SECRET=xxx

# Other (see GITHUB_SECRETS_CHECKLIST.md for complete list)
OPENAI_API_KEY=sk-xxx
...
```

---

## Troubleshooting

**Containers won't start:**
```bash
docker compose -f docker-compose.prod.yml logs
```

**Database connection error:**
- Check `DATABASE_URL` in `.env`
- Ensure database is accessible from server

**SSL certificate issues:**
```bash
sudo certbot renew --dry-run
```

**Port 80/443 in use:**
```bash
sudo lsof -i :80
sudo lsof -i :443
```

---

## Next Steps

- Set up monitoring (e.g., Uptime Robot, Datadog)
- Configure email alerts for health check failures
- Set up automated database backups
- Document deployment runbook for your team

See `DEPLOYMENT_ARCHITECTURE.md` for deeper technical details.
