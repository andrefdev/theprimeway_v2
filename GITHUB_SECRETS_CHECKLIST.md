# GitHub Secrets Checklist

**Location:** Repository → Settings → Secrets and variables → Actions

Copy and paste this checklist to ensure all 29 secrets are configured.

---

## Infrastructure (4 secrets)

- [ ] `SSH_HOST` — Your VPS IP or hostname (e.g., `123.45.67.89` or `deploy.example.com`)
- [ ] `SSH_USER` — Deploy user on VPS (e.g., `deploy`)
- [ ] `SSH_PRIVATE_KEY` — Private SSH key (see "How to get SSH_PRIVATE_KEY" below)
- [ ] `SSH_PORT` — SSH port on VPS (typically `22`, or custom port if configured)

### How to get SSH_PRIVATE_KEY

On your local machine:
```bash
cat ~/.ssh/id_rsa  # Linux/macOS
type %USERPROFILE%\.ssh\id_rsa  # Windows PowerShell

# Copy the entire output, including:
# -----BEGIN RSA PRIVATE KEY-----
# ...
# -----END RSA PRIVATE KEY-----
```

Paste into GitHub secret exactly as-is (no modifications).

---

## Database (1 secret)

- [ ] `DATABASE_URL` — PostgreSQL connection string

**Format:**
```
postgresql://username:password@host:5432/database

# Examples:
# Local:  postgresql://theprimeway:secure_pass@localhost/theprimeway_prod
# Neon:   postgresql://user:pass@neon-endpoint.neon.tech/dbname
```

---

## JWT Authentication (3 secrets)

- [ ] `JWT_SECRET` — Random string (use `openssl rand -base64 32`)
- [ ] `JWT_ACCESS_EXPIRY` — Token lifetime (e.g., `7d`, `24h`)
- [ ] `JWT_REFRESH_EXPIRY` — Refresh token lifetime (e.g., `30d`)

---

## OAuth (4 secrets)

### Google
- [ ] `AUTH_GOOGLE_ID` — Get from Google Cloud Console
- [ ] `AUTH_GOOGLE_SECRET` — Get from Google Cloud Console

**How to create:**
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:5173/callback`
   - `https://app.theprimeway.app/callback`
4. Copy Client ID and Client Secret

### Apple
- [ ] `AUTH_APPLE_ID` — Apple Team ID or Services ID
- [ ] `AUTH_APPLE_SECRET` — Private key from Apple Developer

**How to create:**
1. Go to https://developer.apple.com
2. Create Services ID
3. Create and download private key (`.p8` file)
4. Copy the key content

---

## OpenAI (1 secret)

- [ ] `OPENAI_API_KEY` — Get from https://platform.openai.com/api-keys

---

## Email (SMTP) (5 secrets)

- [ ] `SMTP_HOST` — SMTP server (e.g., `smtp.zeptomail.com`, `smtp.gmail.com`)
- [ ] `SMTP_PORT` — SMTP port (typically `587` for TLS or `465` for SSL)
- [ ] `SMTP_USER` — SMTP username
- [ ] `SMTP_PASS` — SMTP password
- [ ] `SMTP_FROM` — Sender email (e.g., `ThePrimeWay <noreply@theprimeway.app>`)

---

## Payments (3 secrets)

### Lemon Squeezy
- [ ] `LEMON_SQUEEZY_API_KEY` — Get from Lemon Squeezy dashboard
- [ ] `LEMON_SQUEEZY_STORE_ID` — Your store ID
- [ ] `LEMON_SQUEEZY_WEBHOOK_SECRET` — Webhook signing secret

---

## Firebase (3 secrets)

- [ ] `FIREBASE_PROJECT_ID` — Project ID (e.g., `theprimeway-app`)
- [ ] `FIREBASE_CLIENT_EMAIL` — Service account email
- [ ] `FIREBASE_PRIVATE_KEY` — **See important note below**

### How to get Firebase credentials

1. Go to https://console.firebase.google.com → Your project
2. Settings → Service accounts → Generate new private key (JSON)
3. Download the JSON file and open it
4. Copy the `project_id` field → `FIREBASE_PROJECT_ID`
5. Copy the `client_email` field → `FIREBASE_CLIENT_EMAIL`
6. Copy the `private_key` field → `FIREBASE_PRIVATE_KEY`

**⚠️ IMPORTANT for FIREBASE_PRIVATE_KEY:**

The `private_key` field in the JSON looks like:
```
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

Paste it **exactly as-is** into GitHub Secrets, with the `\n` sequences intact (do NOT convert them to real newlines).

The deploy workflow automatically expands them with `printf '%b'` when writing `.env` on the server.

---

## Cloudinary (2 secrets)

- [ ] `CLOUDINARY_CLOUD_NAME` — Your Cloudinary cloud name
- [ ] `CLOUDINARY_UPLOAD_PRESET` — Unsigned upload preset name

**How to get:**
1. Go to https://cloudinary.com → Dashboard
2. Cloud name is visible at the top
3. Settings → Upload → Add upload preset (unsigned recommended)

---

## RapidAPI (1 secret)

- [ ] `RAPIDAPI_KEY` — Get from https://rapidapi.com/hub (for currency exchange, etc.)

---

## Frontend Env Vars (3 secrets)

These are **frontend-facing** (embedded in SPA bundle), so don't put secrets here.

- [ ] `VITE_GOOGLE_CLIENT_ID` — Same as `AUTH_GOOGLE_ID` (this is public)
- [ ] `VITE_APPLE_CLIENT_ID` — Apple Services ID (public)
- [ ] `VITE_APPLE_REDIRECT_URI` — Callback URL (e.g., `https://app.theprimeway.app`)

---

## Summary Table

| Category | Secret Name | Source | Sensitivity |
|----------|------------|--------|-------------|
| **Infra** | SSH_HOST | Your VPS | Low |
| | SSH_USER | Your VPS | Low |
| | SSH_PRIVATE_KEY | Your local machine | **HIGH** — keep safe |
| | SSH_PORT | Your VPS | Low |
| **Database** | DATABASE_URL | PostgreSQL / Neon | **HIGH** |
| **Auth** | JWT_SECRET | Generate random | **HIGH** |
| | JWT_ACCESS_EXPIRY | Config | Low |
| | JWT_REFRESH_EXPIRY | Config | Low |
| | AUTH_GOOGLE_ID | Google Cloud | Medium |
| | AUTH_GOOGLE_SECRET | Google Cloud | **HIGH** |
| | AUTH_APPLE_ID | Apple Developer | Medium |
| | AUTH_APPLE_SECRET | Apple Developer | **HIGH** |
| **APIs** | OPENAI_API_KEY | OpenAI | **HIGH** |
| | RAPIDAPI_KEY | RapidAPI | **HIGH** |
| **Email** | SMTP_HOST | Email provider | Low |
| | SMTP_PORT | Email provider | Low |
| | SMTP_USER | Email provider | Low |
| | SMTP_PASS | Email provider | **HIGH** |
| | SMTP_FROM | Your domain | Low |
| **Payments** | LEMON_SQUEEZY_API_KEY | Lemon Squeezy | **HIGH** |
| | LEMON_SQUEEZY_STORE_ID | Lemon Squeezy | Low |
| | LEMON_SQUEEZY_WEBHOOK_SECRET | Lemon Squeezy | **HIGH** |
| **Firebase** | FIREBASE_PROJECT_ID | Firebase Console | Low |
| | FIREBASE_CLIENT_EMAIL | Firebase Console | Medium |
| | FIREBASE_PRIVATE_KEY | Firebase Console | **HIGH** |
| **Cloudinary** | CLOUDINARY_CLOUD_NAME | Cloudinary | Low |
| | CLOUDINARY_UPLOAD_PRESET | Cloudinary | Low |
| **Frontend** | VITE_GOOGLE_CLIENT_ID | Google Cloud | Low (public) |
| | VITE_APPLE_CLIENT_ID | Apple Developer | Low (public) |
| | VITE_APPLE_REDIRECT_URI | Your domain | Low (public) |

---

## After Creating Secrets

1. Verify all 29 secrets exist in GitHub:
   ```
   Repository → Settings → Secrets and variables → Actions
   ```

2. Make a test commit to `main`:
   ```bash
   git add .
   git commit -m "Setup: add CI/CD pipeline"
   git push origin main
   ```

3. Watch the workflow execute:
   ```
   GitHub → Actions → Deploy workflow
   ```

4. Check that no secrets are exposed in the workflow logs (GitHub masks them automatically)

5. After successful deploy, verify the services are running:
   ```bash
   curl https://api.theprimeway.app/api/health
   curl https://app.theprimeway.app
   curl https://admin.theprimeway.app
   ```

---

## Managing Secrets Safely

- **Never commit `.env` files to Git**
- **Never log secrets in CI output** (GitHub Actions masks them automatically)
- **Rotate secrets periodically:**
  - SSH keys: every 6–12 months
  - API keys: when you suspect exposure
  - Database passwords: when you change DB user password
  - JWT_SECRET: if you need to invalidate all issued tokens

- **Audit secret access:**
  - GitHub logs who accessed Actions
  - Monitor Cloudinary/Firebase/API provider logs for unusual activity

---

## Quick Reference: Copy-Paste List

If you want to build the secrets list yourself:

```
SSH_HOST
SSH_USER
SSH_PRIVATE_KEY
SSH_PORT
DATABASE_URL
JWT_SECRET
JWT_ACCESS_EXPIRY
JWT_REFRESH_EXPIRY
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_APPLE_ID
AUTH_APPLE_SECRET
OPENAI_API_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
LEMON_SQUEEZY_API_KEY
LEMON_SQUEEZY_STORE_ID
LEMON_SQUEEZY_WEBHOOK_SECRET
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_UPLOAD_PRESET
RAPIDAPI_KEY
VITE_GOOGLE_CLIENT_ID
VITE_APPLE_CLIENT_ID
VITE_APPLE_REDIRECT_URI
```

---

## Troubleshooting Secrets

**"Secret not found" error in workflow**
- Check spelling (case-sensitive)
- Verify it was saved by clicking the secret name and seeing "Updated X minutes ago"

**Workflow passes but services don't start**
- Check SSH logs on server: `sudo tail -f /var/log/auth.log`
- Verify the secret values are correct (especially `SSH_PRIVATE_KEY` and `DATABASE_URL`)

**"Permission denied" on SSH**
- Verify public key is in `~/.ssh/authorized_keys` on server
- Check SSH_USER exists on server: `id deploy`

---

## Next Step

Once all 29 secrets are configured, commit your code and push to `main`:

```bash
git add .
git commit -m "feat: Setup CI/CD pipeline, nginx config, PM2"
git push origin main
```

The workflow will start automatically. Monitor it at **GitHub → Actions → Deploy**.
