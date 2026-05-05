# Prisma migrations workflow

How schema changes flow from your laptop to production.

## TL;DR

```bash
# 1. Edit apps/api/prisma/schema.prisma

# 2. Generate the migration locally
pnpm --filter @repo/api db:migrate:new <descriptive_name>

# 3. Commit the schema + the generated migration folder
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(db): <descriptive_name>"
git push
```

CI applies the migration automatically on the server before the API restarts. You don't run anything against production.

## Why migrations are generated locally (and not in CI)

`prisma migrate deploy` only **applies** migrations that already exist in `prisma/migrations/`. It does not generate SQL from a schema change. To generate SQL you need `prisma migrate dev` (which writes a file) or `prisma db push` (which doesn't, and applies destructive changes silently — unsafe for Postgres without PlanetScale-style branching).

So the local step is non-negotiable on this stack. We minimize friction with the `db:migrate:new` script and a CI drift check (see below).

## The scripts (`apps/api/package.json`)

| Script | When to use |
|---|---|
| `db:migrate:new <name>` | Schema changed → create + apply a new migration. Pass the name as an argument. |
| `db:migrate` | After `git pull` → apply any new migrations a teammate committed. |
| `db:generate` | After updating `@prisma/client` or pulling a schema change → regenerate the typed client without touching the DB. |
| `db:push` | **Avoid in shared envs.** Prototyping only — applies schema directly with no migration record. |
| `db:studio` | Opens Prisma Studio on `localhost:5555` to inspect data. |

## How CI / production works

1. `.github/workflows/deploy.yml` job **`validate-prisma`** runs `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --exit-code` against an ephemeral Postgres service. If `schema.prisma` has changes that no migration accounts for, the job fails with a guided error message and `deploy` is blocked.
2. `build-api` builds the Docker image and pushes it to GHCR.
3. `deploy` SSHs into the VPS and runs `docker compose -f docker-compose.prod.yml up -d`.
4. `docker-compose.prod.yml` defines a one-shot `migrate` service that runs `npx prisma migrate deploy` against `DIRECT_DATABASE_URL` (Neon's non-pooled host — required so advisory locks survive PgBouncer recycling).
5. The `api` service has `depends_on: { migrate: { condition: service_completed_successfully } }`, so it only starts after migrations succeed.

## Conventions

- **Name migrations as snake_case verbs**: `add_user_avatar`, `drop_legacy_pomodoro_tables`, `backfill_task_dates`.
- **One migration per logical change.** Don't bundle unrelated schema changes — it makes rollback and code review harder.
- **Never edit a committed migration.** If you need to fix something, create a new migration that corrects it. Rewriting history breaks everyone whose DB has already applied the original.
- **Destructive changes** (drop column, change NOT NULL, change column type with no implicit cast) — read the generated SQL carefully before committing. For columns with prod data, write a backfill migration first.

## What to do if something goes wrong

| Symptom | Fix |
|---|---|
| Local DB drifted (someone reset / weird state) | `pnpm --filter @repo/api exec prisma migrate reset` — wipes the local DB and re-applies all migrations. **Local only.** |
| `validate-prisma` fails in CI saying "schema.prisma diverges" | You edited the schema and forgot to generate the migration. Run `db:migrate:new <name>` locally and commit the new folder. |
| `migrate` container fails on the server | Check the GH Actions step "Pull latest images and start containers" — it dumps the `migrate` container's logs on failure. Most common cause: a destructive migration that the production data violates (e.g. NOT NULL on a column with NULLs). |
| Need to roll back a bad migration in prod | Prisma has no native rollback. Write a forward-fix migration that undoes the change, commit, push. For emergencies, restore from a Neon point-in-time snapshot. |
