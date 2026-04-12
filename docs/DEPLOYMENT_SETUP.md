# Server Setup for ThePrimeWay Docker Deployment

This guide covers the initial setup of a Linux server to run ThePrimeWay via Docker Compose.

---

## Prerequisites

- **OS**: Ubuntu 22.04 LTS or later (Debian-based)
- **Root/Sudo Access**: Required for system-level setup
- **Public Static IP**: For DNS routing
- **Domains**:
  - `api.theprimeway.app`
  - `app.theprimeway.app`
  - `admin.theprimeway.app`
- **External PostgreSQL Database** (or managed service like AWS RDS, DigitalOcean)
  - Not run in Docker (separate from application infrastructure)

---

## 1. System Updates

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Install Docker and Docker Compose Plugin

```bash
# Install Docker
sudo apt install -y docker.io

# Verify Docker
docker --version

# Install Docker Compose plugin (v2.x - recommended)
sudo apt install -y docker-compose-plugin

# Verify Docker Compose
docker compose version

# Allow the deploy user to run Docker without sudo
sudo usermod -aG docker deploy
```

After adding to the group, the user must **log out and log back in** for group membership to take effect.

---

## 3. Set Up Deployment Directory

```bash
# Create directory for ThePrimeWay deployment
sudo mkdir -p /var/www/theprimeway
sudo chown -R deploy:deploy /var/www/theprimeway
sudo chmod -R 755 /var/www/theprimeway
```

---

## 4. Set Up SSL/TLS with Certbot

### Install Certbot

```bash
sudo apt install -y certbot

# Verify
certbot --version
```

### Create Certbot Webroot Directory

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R root:root /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

### Issue Initial Certificate

The first time, get a certificate for all three domains:

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.theprimeway.app \
  -d app.theprimeway.app \
  -d admin.theprimeway.app \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

Certificates are now in `/etc/letsencrypt/live/api.theprimeway.app/`.

### Set Up Auto-Renewal (Cron)

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo systemctl status certbot.timer
```

Certbot will automatically renew certificates 30 days before expiry. Our Docker containers read from `/etc/letsencrypt/` via a volume mount, so no container restart is needed.

---

## 5. Docker Compose Configuration

### Download docker-compose.prod.yml from Repository

The file is already committed in the repo. Copy it to the server:

```bash
# From deployment job (handled automatically) or manually:
scp -P <SSH_PORT> docker-compose.prod.yml deploy@<SERVER_IP>:/var/www/theprimeway/
```

Or download the latest from the GitHub repo:

```bash
cd /var/www/theprimeway
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/nginx/theprimeway.conf
mkdir -p nginx
mv theprimeway.conf nginx/
```

### Environment File

The `.env` file is generated and copied to the server by the GitHub Actions deployment job. If deploying manually, create it with:

```bash
cat > /var/www/theprimeway/.env <<EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/theprimeway
JWT_SECRET=your-jwt-secret
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=xxx
AUTH_APPLE_ID=com.example.theprimeway
AUTH_APPLE_SECRET=xxx
... (all other secrets)
EOF
```

(See `GITHUB_SECRETS_CHECKLIST.md` for complete list)

---

## 6. GitHub Container Registry (GHCR) Authentication (Optional)

If your Docker images are private, authenticate Docker:

```bash
# Create a GitHub Personal Access Token with `packages:read` scope
export GHCR_TOKEN=ghp_xxxxx

# Login
echo $GHCR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Verify (should list your private repos)
docker search ghcr.io/your-username
```

**Note**: If images are public (recommended), this step is not needed.

---

## 7. Start Docker Compose

```bash
cd /var/www/theprimeway

# Set DOCKER_REGISTRY for image name variable substitution
export DOCKER_REGISTRY=$(whoami)  # or your GitHub username

# Pull images from GHCR
docker compose -f docker-compose.prod.yml pull

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Verify services are running
docker compose -f docker-compose.prod.yml ps
```

You should see:
- `migrate` (exited after running migrations)
- `api` (running)
- `web` (running)
- `admin` (running)
- `nginx` (running)

---

## 8. Verify Deployment

### Check Container Logs

```bash
# View API logs
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs api

# Follow real-time logs
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs -f api
```

### Test Health Endpoints

```bash
curl http://localhost/api/health
# Should return: {"status":"ok"}

curl http://localhost
# Should serve web SPA

curl http://localhost/admin
# Should redirect (handled by nginx)
```

### Check Port Exposure

```bash
netstat -tuln | grep LISTEN
# Should see: 0.0.0.0:80 and 0.0.0.0:443
```

---

## 9. Post-Deployment Checks

- [ ] All three domains resolve to server IP
- [ ] HTTPS works: `curl https://api.theprimeway.app/api/health`
- [ ] Database migrations completed: `docker compose logs migrate | grep "Prisma"`
- [ ] API responds to requests
- [ ] Web SPA loads at `https://app.theprimeway.app`
- [ ] Admin panel loads at `https://admin.theprimeway.app`
- [ ] All containers show healthy status: `docker compose ps`

---

## 10. Maintenance Commands

### View Service Status

```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml ps
```

### Restart a Service

```bash
docker compose -f /var/www/theprimeway/docker-compose.prod.yml restart api
```

### Update All Services (Pull Latest Images)

```bash
cd /var/www/theprimeway
export DOCKER_REGISTRY=your-github-username
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### View Logs

```bash
# Real-time API logs
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs -f api

# Last 50 lines
docker compose -f /var/www/theprimeway/docker-compose.prod.yml logs --tail=50 api
```

### Verify Database Connection

```bash
# Test connectivity inside API container
docker compose -f /var/www/theprimeway/docker-compose.prod.yml exec api \
  node -e "require('pg').Client; console.log('PostgreSQL client loaded')"
```

---

## Troubleshooting

### "Cannot connect to Docker daemon"

The deploy user needs to be in the `docker` group and logged in after the change:

```bash
sudo usermod -aG docker deploy
# Then: log out and log back in
```

### "Address already in use" on port 80 or 443

Another service is bound to these ports. Check:

```bash
sudo lsof -i :80
sudo lsof -i :443
```

### Database migrations failed

Check logs:

```bash
docker compose logs migrate
```

Ensure `DATABASE_URL` is correct and the database is accessible.

### SSL certificate renewal fails

Ensure Certbot's webroot challenge location is accessible:

```bash
sudo systemctl status certbot.timer
sudo systemctl status certbot
ls -la /var/www/certbot
```

---

## Security Best Practices

1. **Firewall**: Restrict SSH access
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH Key-based Auth**: Disable password login
   ```bash
   sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl reload sshd
   ```

3. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt autoremove -y
   ```

4. **Monitor Logs**
   ```bash
   sudo journalctl -u docker -f
   ```
