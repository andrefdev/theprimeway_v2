# Admin User Setup

How to create an admin user for the admin panel (`admin.theprimeway.app` / `localhost:5174`).

Admin users are identified by `role = 'admin'` on the `User` table. Non-admin accounts can log into the admin UI but API endpoints return `403 Forbidden`, so the UI treats the login as rejected.

---

## Local Development

A CLI script is provided at `apps/api/scripts/create-admin.ts`. It **upserts** — if the email already exists it updates the password and promotes `role` to `admin`; otherwise it creates a fresh admin user.

### Steps

1. Ensure `DATABASE_URL` is set in `apps/api/.env` (or exported in your shell) and migrations have been applied (`pnpm --filter @repo/api db:migrate`).
2. From the repo root:

    ```bash
    cd apps/api
    pnpm create-admin <email> <password> [name]
    ```

    Example:

    ```bash
    pnpm create-admin admin@intellisoftinnovation.com 'SomeStrongPassword123!' 'André'
    ```

3. Start the API + admin dev servers:

    ```bash
    # Terminal 1
    pnpm --filter @repo/api dev

    # Terminal 2
    pnpm --filter @repo/admin dev
    ```

4. Open http://localhost:5174 and log in.

### Rotate an admin password locally

Re-run `pnpm create-admin <email> <new-password>` with the same email — the script upserts, so it overwrites `passwordHash`.

---

## Production

The prod container image (`theprimeway-api`) is a minimal Node runtime — it does **not** include `tsx` or the `scripts/` folder, so `pnpm create-admin` is not available inside the container. Instead, use one of the two approaches below.

### Approach A (recommended): Register + promote via SQL

This keeps all password hashing inside the API itself (no crypto ops on the server).

1. Register the account through the normal signup flow at https://app.theprimeway.app/register — use the email you want to be admin, pick a strong password.
2. SSH into the VPS and open a `psql` shell against the production database:

    ```bash
    ssh deploy@<server>
    # Use the DATABASE_URL from the api container's env
    docker compose -f /var/www/theprimeway/docker-compose.prod.yml exec api \
      sh -c 'printenv DATABASE_URL'
    # Copy the URL, then:
    psql "<DATABASE_URL>"
    ```

    Or connect directly from your laptop if the DB is reachable:

    ```bash
    psql "$PROD_DATABASE_URL"
    ```

3. Promote the user:

    ```sql
    -- NOTE: the User model has no @@map, so the table is "User" (PascalCase, quoted).
    UPDATE "User"
    SET role = 'admin'
    WHERE email = 'admin@intellisoftinnovation.com';

    -- Verify:
    SELECT id, email, role FROM "User" WHERE email = 'admin@intellisoftinnovation.com';
    ```

4. Log in at https://admin.theprimeway.app.

### Approach B: One-off Node script inside the api container

If you prefer not to register through the UI first, exec a Node one-liner inside the api container — it uses the bundled `@prisma/client` + `bcryptjs` already present in `node_modules`:

```bash
ssh deploy@<server>

EMAIL='admin@intellisoftinnovation.com'
PASSWORD='SomeStrongPassword123!'
NAME='André'

docker compose -f /var/www/theprimeway/docker-compose.prod.yml exec -T api \
  node -e "
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    (async () => {
      const passwordHash = await bcrypt.hash('$PASSWORD', 12);
      const user = await prisma.user.upsert({
        where: { email: '$EMAIL' },
        update: { passwordHash, role: 'admin' },
        create: { email: '$EMAIL', name: '$NAME', passwordHash, role: 'admin' },
        select: { id: true, email: true, role: true },
      });
      console.log(user);
      await prisma.\$disconnect();
    })().catch(async (e) => { console.error(e); await prisma.\$disconnect(); process.exit(1); });
  "
```

Warning: the password appears in shell history and process args. Prefer Approach A unless you really can't register via the UI.

### Rotate a prod admin password

Log in to the admin account via the normal PWA and change the password there, or re-run Approach B with a new password.

---

## Revoking admin

```sql
UPDATE "User" SET role = 'user' WHERE email = '<email>';
```

The user's existing JWT stays valid until it expires — no server-side revocation needed because the admin middleware (`apps/api/src/routes/admin.ts`) re-checks `role` from the DB on every request.
