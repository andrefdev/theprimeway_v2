import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { autoSchedule } from '../services/scheduling/auto-schedule'
import { deconflict } from '../services/scheduling/deconflict'
import { onTaskCompletedEarly } from '../services/scheduling/early-completion-reflow'
import { onTimerStart } from '../services/scheduling/late-timer-detector'

export const schedulingRoutes = new OpenAPIHono<AppEnv>()
schedulingRoutes.use('*', authMiddleware)

const autoScheduleBody = z.object({
  taskId: z.string(),
  day: z.string(), // ISO yyyy-mm-dd
  preventSplit: z.boolean().optional(),
})

schedulingRoutes.post('/auto-schedule', async (c) => {
  const parse = autoScheduleBody.safeParse(await c.req.json())
  if (!parse.success) return c.json({ error: parse.error.message }, 400)
  const { taskId, day, preventSplit } = parse.data
  try {
    const result = await autoSchedule(taskId, new Date(`${day.slice(0, 10)}T00:00:00.000Z`), { preventSplit })
    return c.json({ data: result })
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400)
  }
})

schedulingRoutes.post('/deconflict', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const sessionId = (body as any).sessionId as string | undefined
  if (!sessionId) return c.json({ error: 'sessionId required' }, 400)
  try {
    const result = await deconflict(sessionId)
    return c.json({ data: result })
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400)
  }
})

schedulingRoutes.post('/tasks/:id/complete-early', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { completedAt?: string }
  const at = body.completedAt ? new Date(body.completedAt) : new Date()
  const result = await onTaskCompletedEarly(id, at)
  return c.json({ data: result })
})

schedulingRoutes.post('/tasks/:id/timer-start', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { startedAt?: string }
  const at = body.startedAt ? new Date(body.startedAt) : new Date()
  const result = await onTimerStart(id, at)
  return c.json({ data: result })
})
