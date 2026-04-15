# GitHub Secrets Configuration Checklist

This document lists all 29 GitHub Secrets required for ThePrimeWay deployment via GitHub Actions.

---

## How to Set Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Enter name and value exactly as listed below
4. Click **Add secret**

Repeat for all 29 secrets.

---

## Secrets Checklist

### Infrastructure & Deployment (4 secrets)

- [x] **SSH_HOST**
  - Description: Production server IP or hostname
  - Example: `203.0.113.50`
  - Type: Plain text

- [x] **SSH_PORT**
  - Description: SSH port (usually 22, but use custom if configured)
  - Example: `22`
  - Type: Plain text

- [x] **SSH_USER**
  - Description: SSH user for deployment (usually `deploy`)
  - Example: `deploy`
  - Type: Plain text

- [x] **SSH_PRIVATE_KEY**
  - Description: Private SSH key (multi-line PEM)
  - Example: `-----BEGIN OPENSSH PRIVATE KEY-----\n...content...\n-----END OPENSSH PRIVATE KEY-----`
  - Type: Secret
  - **Important**: Use `pbcopy < ~/.ssh/id_rsa` (macOS) or `xclip < ~/.ssh/id_rsa` (Linux) to copy entire key

---

### Database (1 secret)

- [x] **DATABASE_URL**
  - Description: PostgreSQL connection string
  - Example: `postgresql://appuser:SecurePassword123@db.example.com:5432/theprimeway`
  - Type: Secret
  - **Format**: `postgresql://username:password@host:port/database`
  - **Important**: Use strong password; ensure database is externally accessible from deployment server

---

### Authentication - JWT (3 secrets)

- [x] **JWT_SECRET**
  - Description: Secret key for signing JWTs
  - Example: `your-super-secret-jwt-key-here-minimum-32-characters`
  - Type: Secret
  - **Length**: Minimum 32 characters
  - **Generation**: `openssl rand -base64 32`

- [x] **JWT_ACCESS_EXPIRY**
  - Description: Access token expiration time in seconds
  - Example: `900` (15 minutes)
  - Type: Plain text

- [x] **JWT_REFRESH_EXPIRY**
  - Description: Refresh token expiration time in seconds
  - Example: `604800` (7 days)
  - Type: Plain text

---

### Authentication - Google OAuth (2 secrets)

- [ ] **AUTH_GOOGLE_ID**
  - Description: Google Client ID from Google Cloud Console
  - Example: `123456789-abc123def456.apps.googleusercontent.com`
  - Type: Secret
  - **Source**: [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 Client IDs

- [ ] **AUTH_GOOGLE_SECRET**
  - Description: Google Client Secret
  - Example: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`
  - Type: Secret

---

### Authentication - Apple OAuth (2 secrets)

- [x] **AUTH_APPLE_ID**
  - Description: Apple App ID (reverse domain notation)
  - Example: `com.example.theprimeway`
  - Type: Secret
  - **Source**: [Apple Developer](https://developer.apple.com/) → Certificates, Identifiers & Profiles

- [x] **AUTH_APPLE_SECRET**
  - Description: Apple Client Secret (JWT)
  - Example: `ES256xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (very long)
  - Type: Secret

---

### Authentication - Build-time Vite Variables (3 secrets)

These are injected at **Docker build time**, not secrets (visible in bundle), but still configured in GitHub Secrets for convenience:

- [ ] **VITE_GOOGLE_CLIENT_ID**
  - Description: Same as `AUTH_GOOGLE_ID` (baked into JS bundle, visible to browser)
  - Example: `123456789-abc123def456.apps.googleusercontent.com`
  - Type: Plain text (will be visible in SPA code)

- [ ] **VITE_APPLE_CLIENT_ID**
  - Description: Same as `AUTH_APPLE_ID` (baked into JS bundle)
  - Example: `com.example.theprimeway`
  - Type: Plain text

- [ ] **VITE_APPLE_REDIRECT_URI**
  - Description: Redirect URI for Apple OAuth flow
  - Example: `https://app.theprimeway.app/auth/callback/apple`
  - Type: Plain text

---

### AI & LLM (1 secret)

- [ ] **OPENAI_API_KEY**
  - Description: OpenAI API key
  - Example: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Type: Secret
  - **Source**: [OpenAI Platform](https://platform.openai.com/account/api-keys)

---

### Email (5 secrets)

- [x] **SMTP_HOST**
  - Description: SMTP server hostname
  - Example: `smtp.gmail.com`
  - Type: Plain text

- [x] **SMTP_PORT**
  - Description: SMTP port (usually 587 for TLS, 465 for SSL)
  - Example: `587`
  - Type: Plain text

- [x] **SMTP_USER**
  - Description: SMTP username (usually email address)
  - Example: `noreply@example.com`
  - Type: Secret

- [x] **SMTP_PASS**
  - Description: SMTP password or app-specific password
  - Example: `app-specific-password` (for Gmail, generate at https://myaccount.google.com/apppasswords)
  - Type: Secret

- [x] **SMTP_FROM**
  - Description: From address for outgoing emails
  - Example: `noreply@example.com`
  - Type: Plain text

---

### Payments - Lemon Squeezy (3 secrets)

- [ ] **LEMON_SQUEEZY_API_KEY**
  - Description: Lemon Squeezy API key
  - Example: `eyJ0eXAiOiJKV1QiLCJhbGc...` (long JWT)
  - Type: Secret
  - **Source**: [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com/) → Settings → API

- [ ] **LEMON_SQUEEZY_STORE_ID**
  - Description: Lemon Squeezy Store ID
  - Example: `12345`
  - Type: Plain text

- [ ] **LEMON_SQUEEZY_WEBHOOK_SECRET**
  - Description: Webhook signing secret for Lemon Squeezy
  - Example: `whsec_xxxxxxxxxxxxxxxxxxxxxxxx`
  - Type: Secret

---

### Firebase (3 secrets)

- [x] **FIREBASE_PROJECT_ID**
  - Description: Firebase project ID
  - Example: `theprimeway-prod`
  - Type: Plain text
  - **Source**: [Firebase Console](https://console.firebase.google.com/)

- [x] **FIREBASE_CLIENT_EMAIL**
  - Description: Service account email
  - Example: `firebase-adminsdk-xxxxx@theprimeway-prod.iam.gserviceaccount.com`
  - Type: Secret

- [x] **FIREBASE_PRIVATE_KEY**
  - Description: Service account private key (PEM format)
  - Example: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBA....\n-----END PRIVATE KEY-----\n`
  - Type: Secret
  - **Important**: 
    - Include literal `\n` escape sequences (not actual newlines) in the secret
    - Download from Firebase → Project Settings → Service Accounts → Generate private key
    - The workflow uses `printf '%b'` to expand `\n` to real newlines

---

### Image Hosting - Cloudinary (2 secrets)

- [x] **CLOUDINARY_CLOUD_NAME**
  - Description: Cloudinary cloud name (account ID)
  - Example: `yourcloudname`
  - Type: Plain text
  - **Source**: [Cloudinary Dashboard](https://cloudinary.com/console/)

- [x] **CLOUDINARY_UPLOAD_PRESET**
  - Description: Unsigned upload preset for frontend uploads
  - Example: `unsigned_preset_name`
  - Type: Plain text

---

### External API - RapidAPI (1 secret)

- [x] **RAPIDAPI_KEY**
  - Description: RapidAPI key for third-party API access
  - Example: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Type: Secret
  - **Source**: [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)

---

## Verification Steps

After adding all 29 secrets:

1. **Count**: Go to Settings → Secrets → Actions. Should show **29 secrets** listed.

2. **Test values**: Ensure each secret is non-empty:
   ```bash
   # Locally (with secrets exported)
   echo $SSH_HOST  # Should output your server IP
   echo $DATABASE_URL  # Should output connection string
   ```

3. **Run a test deployment**: Push to `main` and verify GitHub Actions uses all secrets without errors.

4. **Check logs**: GitHub Actions workflow logs should NOT expose secret values (GitHub masks them with `***`).

---

## Secret Rotation

Periodically rotate sensitive secrets:

- [ ] **JWT_SECRET**: Every 6 months
  - Generate new value: `openssl rand -base64 32`
  - Update in GitHub Secrets
  - Restart API service: `docker compose restart api`
  - Existing tokens will be invalidated (users re-login)

- [ ] **AUTH_GOOGLE_SECRET** & **AUTH_APPLE_SECRET**: Follow provider's rotation policy
  - Google: Can create multiple Client IDs; deprecate old one after rotation
  - Apple: Generate new client secret (expires yearly)

- [ ] **API keys** (OPENAI, RAPIDAPI, LEMON_SQUEEZY): If compromised
  - Revoke in provider dashboard
  - Generate new key
  - Update GitHub Secret
  - Restart affected services

- [ ] **FIREBASE_PRIVATE_KEY**: Every 6-12 months
  - Generate new key in Firebase Console
  - Update GitHub Secret
  - Restart API service

---

## Debugging Secret Issues

### Secret not loaded in workflow

```yaml
# Verify secret is passed correctly:
- name: Test Secret
  env:
    MY_SECRET: ${{ secrets.MY_SECRET }}
  run: |
    if [ -z "$MY_SECRET" ]; then
      echo "ERROR: MY_SECRET not found!"
      exit 1
    fi
    echo "SECRET FOUND"
```

### Secret value contains special characters

Ensure special characters are NOT escaped when pasting:
- ✅ Correct: `password@123!xyz`
- ❌ Wrong: `password\@123\!xyz` (backslashes are literal)

### Multiline secret (like FIREBASE_PRIVATE_KEY)

When pasting multi-line values:
1. Copy the entire key including `-----BEGIN-----` and `-----END-----`
2. Paste directly into GitHub's text field
3. GitHub will preserve the format

---

## Quick Reference: Where to Get Each Secret

| Secret | Source |
|--------|--------|
| SSH_HOST | Your server IP |
| SSH_PRIVATE_KEY | `~/.ssh/id_rsa` |
| DATABASE_URL | Your PostgreSQL provider |
| JWT_SECRET | Generate: `openssl rand -base64 32` |
| GOOGLE_* | [Google Cloud Console](https://console.cloud.google.com) |
| APPLE_* | [Apple Developer](https://developer.apple.com) |
| OPENAI_API_KEY | [OpenAI Platform](https://platform.openai.com) |
| SMTP_* | Your email provider (Gmail, SendGrid, etc.) |
| LEMON_SQUEEZY_* | [Lemon Squeezy](https://app.lemonsqueezy.com) |
| FIREBASE_* | [Firebase Console](https://console.firebase.google.com) |
| CLOUDINARY_* | [Cloudinary](https://cloudinary.com/console) |
| RAPIDAPI_KEY | [RapidAPI](https://rapidapi.com/developer/dashboard) |

---

## Testing Secrets Without Deployment

Locally test that all secrets are set:

```bash
# Export all secrets to a local .env file
# (Never commit this file!)

cat > /tmp/test.env <<'EOF'
SSH_HOST=${{ secrets.SSH_HOST }}
SSH_USER=${{ secrets.SSH_USER }}
... (all 29 secrets)
EOF

# Use `envsubst` or similar to verify values
source /tmp/test.env
echo $DATABASE_URL  # Should output your DB connection string
```

---

## Security Best Practices

1. **Never log secrets**: GitHub automatically masks secrets in logs, but be careful with `echo` or `console.log`
2. **Rotate regularly**: Set calendar reminders to rotate sensitive secrets every 3-6 months
3. **Limit access**: Only grant GitHub Secrets access to necessary workflows
4. **Audit usage**: Review GitHub Actions audit log for secret access
5. **Don't hardcode**: Never commit secrets to repository

---

## Troubleshooting: "Secret not found" Error

If GitHub Actions fails with "Secret not found", ensure:
1. Secret name is **exact match** (case-sensitive): `SSH_HOST` not `ssh_host`
2. Secret is **not empty** — paste actual value, not placeholder
3. Secret is set in **repo Settings**, not organization
4. Workflow syntax uses `${{ secrets.SECRET_NAME }}`
