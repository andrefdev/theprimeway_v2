import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { channelsService } from '../services/channels.service'

export const channelsRoutes = new OpenAPIHono<AppEnv>()
channelsRoutes.use('*', authMiddleware)

const ctxCreate = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(20).default('#3B82F6'),
  isPersonal: z.boolean().default(false),
  position: z.number().int().default(0),
})
const chCreate = z.object({
  contextId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().max(20).default('#3B82F6'),
  isDefault: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  importFromCalendarId: z.string().optional(),
  timeboxToCalendarId: z.string().optional(),
  slackChannelId: z.string().optional(),
  asanaProjectId: z.string().optional(),
})

channelsRoutes.get('/contexts', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await channelsService.listContexts(userId) })
})

channelsRoutes.post('/contexts', async (c) => {
  const userId = c.get('user').userId
  const body = ctxCreate.parse(await c.req.json())
  return c.json({ data: await channelsService.createContext(userId, body) }, 201)
})

channelsRoutes.patch('/contexts/:id', async (c) => {
  const userId = c.get('user').userId
  const body = ctxCreate.partial().parse(await c.req.json())
  const row = await channelsService.updateContext(userId, c.req.param('id'), body)
  if (!row) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: row })
})

channelsRoutes.delete('/contexts/:id', async (c) => {
  const userId = c.get('user').userId
  const ok = await channelsService.deleteContext(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})

channelsRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await channelsService.listChannels(userId) })
})

channelsRoutes.post('/', async (c) => {
  const userId = c.get('user').userId
  const body = chCreate.parse(await c.req.json())
  return c.json({ data: await channelsService.createChannel(userId, body) }, 201)
})

channelsRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').userId
  const body = chCreate.partial().parse(await c.req.json())
  const row = await channelsService.updateChannel(userId, c.req.param('id'), body)
  if (!row) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: row })
})

channelsRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').userId
  const ok = await channelsService.deleteChannel(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})

channelsRoutes.post('/seed-defaults', async (c) => {
  const userId = c.get('user').userId
  await channelsService.seedDefaults(userId)
  return c.json({ data: { ok: true } })
})
