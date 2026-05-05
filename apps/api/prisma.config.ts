import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// SHADOW_DATABASE_URL is optional locally (Prisma will create one on the fly
// against the same server when missing) but required in CI for `migrate diff
// --from-migrations`, which needs a clean DB to replay migrations into.
const shadowUrl = process.env.SHADOW_DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    ...(shadowUrl ? { shadowDatabaseUrl: env('SHADOW_DATABASE_URL') } : {}),
  },
})
