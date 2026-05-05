# Migrations workflow — test checkpoint

Run through this once after the changes land to confirm the new workflow + drift check actually work end-to-end. Tick boxes as you go.

## Prerequisites

- [ ] Docker Desktop is running (`docker info` works).
- [ ] You're on a throwaway branch, **not `main`**: `git checkout -b chore/test-migrations-workflow`.
- [ ] `apps/api/.env` exists with `DATABASE_URL=postgresql://theprimeway:dev123@localhost:5433/theprimeway_dev`.

## Step 1 — local DB up + clean state

```bash
pnpm db:up                                              # starts the postgres container
pnpm --filter @repo/api db:migrate                      # applies all 22 existing migrations
```

- [ ] `db:up` exits 0; `docker ps` shows `postgres:17-alpine` listening on `5433`.
- [ ] `db:migrate` says "Already in sync, no schema change or pending migration was found" (or applies the missing ones if your local DB was empty) — no errors.

## Step 2 — `db:migrate:new` script works

Add a harmless field to a model in `apps/api/prisma/schema.prisma`. Suggested: pick a model with no relations and add an optional column.

```prisma
model User {
  // ...existing fields
  testCheckpointField String?  // TEMP — remove before committing for real
}
```

Then:

```bash
pnpm --filter @repo/api db:migrate:new test_checkpoint_field
```

- [ ] Command runs non-interactively (no prompt asking for a name).
- [ ] A new folder `apps/api/prisma/migrations/<timestamp>_test_checkpoint_field/` appears.
- [ ] It contains a `migration.sql` with an `ALTER TABLE "User" ADD COLUMN "testCheckpointField"` statement.
- [ ] `db:studio` (or `psql`) shows the column exists in the local DB.

## Step 3 — drift check fails when migration is missing (the important one)

Revert the migration locally so we can simulate the "forgot to commit" case:

```bash
# Delete the migration folder and let prisma reset, OR just delete the folder
# and use migrate resolve. Simplest: nuke and reset.
rm -rf apps/api/prisma/migrations/<timestamp>_test_checkpoint_field
pnpm --filter @repo/api exec prisma migrate reset --force
```

Now keep the schema change but DON'T generate a migration. Commit only the schema:

```bash
git add apps/api/prisma/schema.prisma
git commit -m "test: schema change without migration (should fail CI)"
git push -u origin chore/test-migrations-workflow
```

Open the GitHub Actions run for this push.

- [ ] `Validate Prisma` job runs (api files changed → `needs.changes.outputs.api == 'true'`).
- [ ] It fails on the step **"Verify schema matches migrations"**.
- [ ] The failure log contains the guided message: `schema.prisma diverges from prisma/migrations/. Run 'pnpm --filter @repo/api db:migrate:new <name>' locally and commit the new migration.`
- [ ] `Deploy` job is skipped (its `if:` excludes failure in `needs`).

## Step 4 — drift check passes once the migration exists

Generate the migration the right way and push:

```bash
pnpm --filter @repo/api db:migrate:new test_checkpoint_field
git add apps/api/prisma/
git commit -m "test: add migration for schema change"
git push
```

- [ ] `Validate Prisma` passes (~1–2 min including pnpm install).
- [ ] `Build API` runs and succeeds.
- [ ] (If you merge to `main`) `Deploy` runs, the server pulls the image, the `migrate` service applies the new migration, and `api` restarts. Health check at `https://api.theprimeway.app/api/health` returns 200.

## Step 5 — clean up

- [ ] Revert / delete the test migration: edit `schema.prisma` to remove `testCheckpointField`, run `db:migrate:new remove_test_checkpoint_field`, OR
- [ ] Just abandon the test branch (don't merge): `git checkout main && git branch -D chore/test-migrations-workflow && git push origin --delete chore/test-migrations-workflow`.

## Sanity checks if anything misbehaved

- **`db:migrate:new` complains the name is missing**: pnpm strips trailing args sometimes — try `pnpm --filter @repo/api exec prisma migrate dev --name <name>` directly.
- **`Validate Prisma` job fails on `pnpm install`**: the workspace lockfile may not match — check the CI logs and run `pnpm install` locally to update if needed.
- **`Validate Prisma` passes when it shouldn't**: confirm the postgres service container actually came up healthy in the CI logs (look for `Service container postgres ... healthy`).
- **`migrate` service on the server fails**: check GH Actions "Pull latest images" step — it dumps the migrate container's logs on failure.
