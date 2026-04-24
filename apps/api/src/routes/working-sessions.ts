import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { workingSessionsService } from '../services/working-sessions.service'

export const workingSessionsRoutes = new OpenAPIHono<AppEnv>()
workingSessionsRoutes.use('*', authMiddleware)

const kindEnum = z.enum(['WORK', 'POMODORO', 'BREAK', 'HABIT_LOG'])
const sourceEnum = z.enum(['USER', 'AUTO_SCHEDULE', 'AUTO_RESCHEDULE', 'SPLIT', 'IMPORT'])

const createSchema = z.object({
  taskId: z.string().uuid().optional(),
  kind: kindEnum.default('WORK'),
  start: z.coerce.date(),
  end: z.coerce.date(),
  externalCalendarId: z.string().optional(),
  externalEventId: z.string().optional(),
  createdBy: sourceEnum.optional(),
})

workingSessionsRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  const sessions = await workingSessionsService.list(userId, {
    from: c.req.query('from'),
    to: c.req.query('to'),
    taskId: c.req.query('taskId'),
  })
  return c.json({ data: sessions, count: sessions.length })
})

workingSessionsRoutes.post('/', async (c) => {
  const userId = c.get('user').userId
  const body = createSchema.parse(await c.req.json())
  const result = await workingSessionsService.create(userId, body)
  if (!result.ok) return c.json({ error: result.message }, 400)
  return c.json({ data: result.session }, 201)
})

workingSessionsRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').userId
  const body = createSchema.partial().parse(await c.req.json())
  const result = await workingSessionsService.update(userId, c.req.param('id'), body)
  if (!result.ok) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: result.session })
})

workingSessionsRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').userId
  const result = await workingSessionsService.delete(userId, c.req.param('id'))
  if (!result.ok) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})
