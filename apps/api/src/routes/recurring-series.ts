import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { recurringService } from '../services/recurring.service'

export const recurringSeriesRoutes = new OpenAPIHono<AppEnv>()
recurringSeriesRoutes.use('*', authMiddleware)

const patternEnum = z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY'])

const createSchema = z.object({
  templateTaskJson: z.record(z.any()),
  pattern: patternEnum,
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  atRoughlyTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
})

recurringSeriesRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await recurringService.list(userId) })
})

recurringSeriesRoutes.post('/', async (c) => {
  const userId = c.get('user').userId
  const body = createSchema.parse(await c.req.json())
  return c.json({ data: await recurringService.create(userId, body) }, 201)
})

recurringSeriesRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').userId
  const body = createSchema.partial().parse(await c.req.json())
  const row = await recurringService.update(userId, c.req.param('id'), body)
  if (!row) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: row })
})

recurringSeriesRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').userId
  const ok = await recurringService.delete(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})

recurringSeriesRoutes.post('/materialize', async (c) => {
  const userId = c.get('user').userId
  const body = (await c.req.json().catch(() => ({}))) as { referenceDate?: string }
  const ref = body.referenceDate ? new Date(body.referenceDate) : new Date()
  return c.json({ data: await recurringService.materializeForUser(userId, ref) })
})
