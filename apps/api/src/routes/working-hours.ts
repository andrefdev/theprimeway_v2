import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { workingHoursService, workingHoursOverrideService } from '../services/working-hours.service'

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

// ---- Per-day overrides (Sunsama-style draggable day bars) ------------------
const datePathRe = /^\d{4}-\d{2}-\d{2}$/
const overrideSchema = z.object({ startTime: hhmm, endTime: hhmm })

workingHoursRoutes.get('/overrides/:date', async (c) => {
  const userId = c.get('user').userId
  const date = c.req.param('date')
  if (!datePathRe.test(date)) return c.json({ error: 'Invalid date' }, 400)
  const row = await workingHoursOverrideService.find(userId, date)
  return c.json({ data: row })
})

workingHoursRoutes.put('/overrides/:date', async (c) => {
  const userId = c.get('user').userId
  const date = c.req.param('date')
  if (!datePathRe.test(date)) return c.json({ error: 'Invalid date' }, 400)
  const body = overrideSchema.parse(await c.req.json())
  try {
    const row = await workingHoursOverrideService.upsert(userId, date, body)
    return c.json({ data: row })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

workingHoursRoutes.delete('/overrides/:date', async (c) => {
  const userId = c.get('user').userId
  const date = c.req.param('date')
  if (!datePathRe.test(date)) return c.json({ error: 'Invalid date' }, 400)
  await workingHoursOverrideService.delete(userId, date)
  return c.body(null, 204)
})
