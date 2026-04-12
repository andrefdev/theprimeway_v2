# ThePrimeWay Deployment Setup Guide

## Overview

Este proyecto usa un flujo CI/CD automatizado via GitHub Actions que:
1. Detecta cambios en el código
2. Compila (API via Hono/tsup, web/admin via Vite)
3. Transfiere a un VPS via rsync + SSH
4. Ejecuta migraciones de base de datos (API)
5. Reinicia los servicios (PM2 para API, nginx para web/admin)

**Archivos generados:**
- `.github/workflows/deploy.yml` — Workflow de CI/CD
- `nginx/theprimeway.conf` — Configuración de nginx
- `apps/api/ecosystem.config.cjs` — Configuración de PM2

---

## Paso 1: Preparar el VPS (una sola vez)

Asume que tienes acceso SSH a un servidor Linux (Ubuntu 20.04+) con:
- Node.js 22+
- pnpm 9.12.2+
- PostgreSQL 17 (o Neon serverless)
- nginx
- PM2 (global o local)

### 1.1. Crear directorios y permisos

```bash
sudo mkdir -p /var/www/theprimeway/{api,api-next,api-old,web,admin}
sudo mkdir -p /var/log/pm2
sudo chown -R deploy:deploy /var/www/theprimeway /var/log/pm2

# Crear archivo .gitkeep para rastrear los dirs (opcional)
touch /var/www/theprimeway/{api,web,admin}/.gitkeep
```

Reemplaza `deploy` con tu usuario SSH real.

### 1.2. Instalar y configurar nginx

```bash
sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx

# Copiar configuración de nginx
sudo cp nginx/theprimeway.conf /etc/nginx/sites-available/theprimeway.conf

# Crear symlink para habilitar el sitio
sudo ln -s /etc/nginx/sites-available/theprimeway.conf /etc/nginx/sites-enabled/

# Validar sintaxis de nginx
sudo nginx -t

# Recargar nginx (SSL no está habilitado aún, solo HTTP)
sudo systemctl reload nginx
```

### 1.3. Configurar SSL con Certbot (cuando DNS esté apuntando)

```bash
# Ejecutar Certbot para los 3 dominios
sudo certbot --nginx \
  -d api.theprimeway.app \
  -d app.theprimeway.app \
  -d admin.theprimeway.app

# Certbot auto-editará el archivo .conf con directivas SSL
# y configurará renovación automática
```

### 1.4. Configurar PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2@latest

# (Como usuario deploy) Configurar startup y guardar lista
pm2 startup
# Ejecutar el comando `sudo` que imprime la salida anterior

pm2 save
```

### 1.5. Permitir que el usuario deploy recargue nginx sin contraseña

```bash
sudo visudo -f /etc/sudoers.d/deploy-nginx

# Agregar esta línea (reemplaza 'deploy' si es diferente tu usuario):
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/sbin/nginx -t
```

### 1.6. Base de datos

**Opción A: PostgreSQL local en el servidor**
```bash
sudo apt-get install -y postgresql postgresql-contrib
# Crear DB y usuario según sea necesario
sudo -u postgres psql -c "CREATE DATABASE theprimeway_prod;"
sudo -u postgres psql -c "CREATE USER theprimeway WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "ALTER ROLE theprimeway SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE theprimeway_prod TO theprimeway;"
```

**Opción B: Neon (serverless PostgreSQL)**
- Crear un proyecto en https://console.neon.tech
- Copiar la `DATABASE_URL` de la forma `postgresql://...` (credenciales incluidas)

---

## Paso 2: Configurar GitHub Secrets

En tu repositorio GitHub, ve a **Settings → Secrets and variables → Actions** y agrega los siguientes 29 secrets:

### Infraestructura (4)
```
SSH_HOST        = tu-servidor.com  (o IP)
SSH_USER        = deploy           (usuario en el VPS)
SSH_PRIVATE_KEY = <contenido de ~/.ssh/id_rsa de tu máquina local>
SSH_PORT        = 22              (o el puerto SSH custom)
```

Para obtener `SSH_PRIVATE_KEY`:
```bash
# En tu máquina local
cat ~/.ssh/id_rsa | pbcopy  # macOS
cat ~/.ssh/id_rsa | xclip   # Linux
```

Asegúrate de que la **clave pública** (`~/.ssh/id_rsa.pub`) esté en `~/.ssh/authorized_keys` del servidor.

### Base de datos (1)
```
DATABASE_URL = postgresql://user:password@host/dbname
               (o postgres://user:pass@neon-endpoint.neon.tech/dbname si usas Neon)
```

### JWT (3)
```
JWT_SECRET          = <una string aleatoria fuerte, 32+ caracteres>
JWT_ACCESS_EXPIRY   = 7d
JWT_REFRESH_EXPIRY  = 30d
```

Genera el secret con:
```bash
openssl rand -base64 32
```

### OAuth — Google (2)
```
AUTH_GOOGLE_ID     = <tu Google OAuth client ID>
AUTH_GOOGLE_SECRET = <tu Google OAuth client secret>
```

Ve a https://console.cloud.google.com → Create OAuth 2.0 credentials

### OAuth — Apple (2)
```
AUTH_APPLE_ID     = <Apple Sign in with Apple ID>
AUTH_APPLE_SECRET = <Apple private key>
```

### Otros (14)
```
OPENAI_API_KEY
SMTP_HOST          = smtp.zeptomail.com  (o tu SMTP)
SMTP_PORT          = 587
SMTP_USER
SMTP_PASS
SMTP_FROM          = ThePrimeWay <noreply@theprimeway.app>
LEMON_SQUEEZY_API_KEY
LEMON_SQUEEZY_STORE_ID
LEMON_SQUEEZY_WEBHOOK_SECRET
FIREBASE_PROJECT_ID      = theprimeway-app
FIREBASE_CLIENT_EMAIL    = <firebase-adminsdk-xxx@theprimeway-app.iam.gserviceaccount.com>
FIREBASE_PRIVATE_KEY     = <ver abajo>
CLOUDINARY_CLOUD_NAME
CLOUDINARY_UPLOAD_PRESET
RAPIDAPI_KEY
```

### Frontend (3)
```
VITE_GOOGLE_CLIENT_ID      = <tu Google OAuth client ID (público)>
VITE_APPLE_CLIENT_ID       = <Apple client ID (público)>
VITE_APPLE_REDIRECT_URI    = https://app.theprimeway.app
```

### ⚠️ Notas importantes

**FIREBASE_PRIVATE_KEY:**
- Descarga el JSON de credenciales de Firebase Console
- Copia el valor del campo `private_key` **exactamente como está** (incluye `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----` con `\n` literales)
- Ejemplo:
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBA...muuucho texto...\n-----END PRIVATE KEY-----\n
  ```
- El workflow lo expande automáticamente con `printf '%b'`

**SSH_PRIVATE_KEY:**
- Debe ser la **clave privada SIN passphrase** (si la generaste con passphrase, GitHub Actions no podrá usarla)
- Incluye las líneas `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`

---

## Paso 3: Verificar todo funciona

### 3.1. Hacer un push a main con un pequeño cambio

```bash
git add .
git commit -m "Setup: add CI/CD pipeline and nginx config"
git push origin main
```

### 3.2. Monitorear el workflow

Ve a **GitHub → Actions** y observa el progreso del workflow `Deploy`:
- Debe detectar cambios en `apps/api/`, `apps/web/`, `apps/admin/`, `packages/shared/`
- Deben ejecutarse los 3 jobs en paralelo (o secuencial según tu configuración)

### 3.3. Verificar salud de los servicios

```bash
# API
curl https://api.theprimeway.app/api/health
# Debe responder { "status": "ok", ... }

# Web
curl https://app.theprimeway.app
# Debe responder con HTML de la SPA (index.html)

# Admin
curl https://admin.theprimeway.app
# Debe responder con HTML de la SPA admin
```

### 3.4. Verificar logs en el servidor

```bash
# PM2 API
pm2 logs theprimeway-api

# nginx (si hay errores)
sudo tail -f /var/log/nginx/error.log

# PM2 PM2Manager
pm2 logs
```

---

## Paso 4: Configuración local para desarrollo

**No necesitas hacer nada adicional** — el workflow es completamente automático.

Para desarrollo local, sigue las instrucciones en `README.md` de este repo:
```bash
pnpm install
pnpm dev      # Inicia dev servers en paralelo
```

---

## Troubleshooting

### El workflow falla en "Run migrations"

**Síntoma:** `prisma migrate deploy` falla en el servidor

**Soluciones:**
1. Verifica que `DATABASE_URL` en GitHub Secrets es correcto
2. Verifica que la base de datos existe y es accesible desde el servidor
3. Mira los logs del workflow en GitHub Actions → output de SSH

**Recovery:** El swap atómico no ocurre si la migración falla, así que la versión anterior de la API sigue sirviendo. Arregla el problema y haz push nuevamente.

### El deployment es lento

**Causa típica:** Compilación de TypeScript es lenta en runners de GitHub Actions

**Soluciones:**
1. Activa Turbo remote caching (opcional, pero recomendado)
2. Usa `@pnpm/action-setup@v4` con caching habilitado (ya está en el workflow)

### nginx dice "host not allowed"

**Síntoma:** `nginx -t` pasa pero el reload falla

**Causa:** Probablemente no está habilitada la configuración

```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

### SSH key permission denied

**Síntoma:** `Permission denied (publickey)` en rsync o appleboy

**Soluciones:**
1. Verifica que la clave pública está en `~/.ssh/authorized_keys` del servidor
2. Verifica que el usuario `SSH_USER` existe en el servidor
3. Prueba SSH manualmente desde tu máquina local

```bash
ssh -i ~/.ssh/id_rsa -p 22 deploy@tu-servidor.com
```

---

## Cambios futuros comunes

### Agregar una nueva variable de entorno

1. Agrégala al archivo `apps/api/.env.example` (documentación)
2. Crea el GitHub Secret en Settings → Secrets
3. Agregala al `env:` block en `.github/workflows/deploy.yml` bajo el job `deploy-api`
4. Haz push

### Cambiar el dominio

Reemplaza `api.theprimeway.app`, `app.theprimeway.app`, `admin.theprimeway.app` en:
- `nginx/theprimeway.conf` (server_name, Certbot)
- `apps/api/src/app.ts` (CORS origins si es necesario)
- `apps/desktop/src-tauri/tauri.conf.json` (CSP si es necesario)

### Escalar a múltiples servidores

1. Crea un load balancer (nginx, HAProxy, ELB de AWS)
2. Desplega esta configuración a múltiples servidores
3. Apunta el load balancer a todos ellos

---

## Seguridad

- **Nunca hardcodees secrets en el código** — usa GitHub Secrets
- **Rotate SSH keys regularmente** — considera una clave de deploy dedicada
- **Monitorea los logs** — detecta intentos fallidos de login o acceso
- **Usa HTTPS siempre** — Certbot mantiene certificados renovados automáticamente
- **Restringe acceso SSH** — usa IP whitelist en el firewall del servidor si es posible

---

## Próximos pasos

1. ✅ Crea los 3 archivos (ya está hecho)
2. ⏳ Prepara el VPS siguiendo el Paso 1
3. ⏳ Agrega los 29 GitHub Secrets (Paso 2)
4. ⏳ Haz un push a `main` y verifica en GitHub Actions
5. ⏳ Confirma que `https://api.theprimeway.app/api/health` responde

---

**¿Preguntas?** Revisa los logs del workflow en GitHub Actions → Deploy workflow → paso específico que falle.
