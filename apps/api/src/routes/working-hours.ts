import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { workingHoursService } from '../services/working-hours.service'

export const workingHoursRoutes = new OpenAPIHono<AppEnv>()
workingHoursRoutes.use('*', authMiddleware)

const hhmm = z.string().regex(/^\d{2}:\d{2}$/)
const createSchema = z.object({
  channelId: z.string().uuid().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: hhmm,
  endTime: hhmm,
})

workingHoursRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  const rows = await workingHoursService.list(userId, c.req.query('channelId') ?? null)
  return c.json({ data: rows })
})

workingHoursRoutes.post('/', async (c) => {
  const userId = c.get('user').userId
  const body = createSchema.parse(await c.req.json())
  const row = await workingHoursService.create(userId, body)
  return c.json({ data: row }, 201)
})

workingHoursRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').userId
  const body = createSchema.partial().parse(await c.req.json())
  const row = await workingHoursService.update(userId, c.req.param('id'), body)
  if (!row) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: row })
})

workingHoursRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').userId
  const ok = await workingHoursService.delete(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})

workingHoursRoutes.put('/', async (c) => {
  const userId = c.get('user').userId
  const body = z.array(createSchema).parse(await c.req.json())
  const count = await workingHoursService.bulkReplace(userId, c.req.query('channelId') ?? null, body)
  return c.json({ data: { ok: true, count } })
})
