import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { visionService } from '../services/vision.service'

export const visionRoutes = new OpenAPIHono<AppEnv>()
visionRoutes.use('*', authMiddleware)

const upsertSchema = z.object({
  statement: z.string().min(1).max(2000),
  coreValues: z.array(z.string()).max(10).default([]),
  identityStatements: z.array(z.string()).max(10).default([]),
})

visionRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await visionService.get(userId) })
})

visionRoutes.put('/', async (c) => {
  const userId = c.get('user').userId
  const body = upsertSchema.parse(await c.req.json())
  return c.json({ data: await visionService.upsert(userId, body) })
})

visionRoutes.delete('/', async (c) => {
  const userId = c.get('user').userId
  await visionService.delete(userId)
  return c.body(null, 204)
})

visionRoutes.get('/thread/:taskId', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await visionService.thread(userId, c.req.param('taskId')) })
})
