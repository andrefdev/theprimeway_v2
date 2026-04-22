import 'dotenv/config'
import './lib/sentry'
import { serve } from '@hono/node-server'
import { app } from './app'
import { attachSyncServer } from './lib/sync-server'
import { subscribeGamificationHandlers } from './services/gamification/event-handler'

subscribeGamificationHandlers()

const port = Number(process.env.PORT) || 3001

console.log(`🚀 API server starting on http://localhost:${port}`)
console.log(`📄 Swagger docs at http://localhost:${port}/docs`)

const server = serve({ fetch: app.fetch, port })
attachSyncServer(server as any)
