#!/bin/bash
# First-time server setup for ThePrimeWay
# Run this ONCE on the VPS before the first GitHub Actions deploy
#
# Usage: ssh user@server 'bash -s' < scripts/init-server.sh

set -e

echo "=== ThePrimeWay Server Init ==="

# 1. Create project directory
sudo mkdir -p /var/www/theprimeway/nginx
sudo mkdir -p /var/www/certbot

# 2. Install certbot if not present
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  sudo apt-get update && sudo apt-get install -y certbot
fi

# 3. Ensure Docker is installed
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker not installed. Install Docker first:"
  echo "  curl -fsSL https://get.docker.com | sh"
  exit 1
fi

# 4. Request SSL certificates (HTTP-01 challenge via standalone)
# Make sure DNS A records point to this server BEFORE running this
echo ""
echo "Requesting SSL certificates..."
echo "Make sure these DNS records point to this server's IP:"
echo "  - api.theprimeway.app   → $(curl -s ifconfig.me)"
echo "  - app.theprimeway.app   → $(curl -s ifconfig.me)"
echo "  - admin.theprimeway.app → $(curl -s ifconfig.me)"
echo ""

# Stop anything on port 80 temporarily
sudo systemctl stop nginx 2>/dev/null || true
docker stop $(docker ps -q --filter "publish=80") 2>/dev/null || true

for domain in api.theprimeway.app app.theprimeway.app admin.theprimeway.app; do
  if [ ! -d "/etc/letsencrypt/live/$domain" ]; then
    echo "Getting cert for $domain..."
    sudo certbot certonly --standalone \
      -d "$domain" \
      --non-interactive \
      --agree-tos \
      --email admin@intellisoftinnovation.com \
      --no-eff-email
  else
    echo "Cert for $domain already exists, skipping."
  fi
done

# 5. Set up auto-renewal cron
if ! crontab -l 2>/dev/null | grep -q certbot; then
  echo "Setting up certbot auto-renewal..."
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker exec theprimeway-nginx-1 nginx -s reload'") | crontab -
fi

# 6. Login to GHCR (needed to pull images)
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Make sure GitHub Actions secrets are configured (SSH_HOST, etc.)"
echo "  2. Push to main branch to trigger deploy"
echo "  3. Or manually: cd /var/www/theprimeway && docker compose -f docker-compose.prod.yml up -d"
echo ""
