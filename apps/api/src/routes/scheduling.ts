import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { schedulingFacade } from '../services/scheduling/scheduling-facade'

export const schedulingRoutes = new OpenAPIHono<AppEnv>()
schedulingRoutes.use('*', authMiddleware)

const autoScheduleBody = z.object({
  taskId: z.string(),
  day: z.string(), // ISO yyyy-mm-dd
  preventSplit: z.boolean().optional(),
})

const moveSessionBody = z.object({
  sessionId: z.string().optional(),
  taskId: z.string().optional(),
  start: z.string(),
  end: z.string(),
  deconflict: z.boolean().optional(),
})

schedulingRoutes.post('/auto-schedule', async (c) => {
  const parse = autoScheduleBody.safeParse(await c.req.json())
  if (!parse.success) return c.json({ error: parse.error.message }, 400)
  const { taskId, day, preventSplit } = parse.data
  try {
    const result = await schedulingFacade.scheduleTask(taskId, day.slice(0, 10), { preventSplit })
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
    const result = await schedulingFacade.deconflict(sessionId)
    return c.json({ data: result })
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400)
  }
})

/**
 * Move/create a session at an explicit slot — the canonical drag/drop endpoint.
 * If `sessionId` is provided, moves it. Otherwise creates a new session for `taskId`.
 * Both paths route through SchedulingFacade so Task mirror, deconflict, Google
 * push and sync events stay consistent.
 */
schedulingRoutes.post('/sessions/move', async (c) => {
  const userId = (c.get('user') as any).userId as string
  const parse = moveSessionBody.safeParse(await c.req.json())
  if (!parse.success) return c.json({ error: parse.error.message }, 400)
  const { sessionId, taskId, start, end, deconflict: doDeconflict } = parse.data
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return c.json({ error: 'invalid date' }, 400)
  }
  try {
    if (sessionId) {
      const r = await schedulingFacade.moveSession(userId, sessionId, startDate, endDate, {
        deconflict: doDeconflict,
      })
      if (!r.ok) return c.json({ error: r.reason }, r.reason === 'not_found' ? 404 : 400)
      return c.json({ data: { session: r.session, commandId: r.commandId } })
    }
    if (!taskId) return c.json({ error: 'sessionId or taskId required' }, 400)
    const r = await schedulingFacade.createSession(
      { userId, taskId, start: startDate, end: endDate },
      { deconflict: doDeconflict },
    )
    return c.json({ data: { session: r.session, commandId: r.commandId } })
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400)
  }
})

schedulingRoutes.post('/tasks/:id/complete-early', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { completedAt?: string }
  const at = body.completedAt ? new Date(body.completedAt) : new Date()
  const result = await schedulingFacade.reflowEarlyCompletion(id, at)
  return c.json({ data: result })
})

schedulingRoutes.post('/tasks/:id/timer-start', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { startedAt?: string }
  const at = body.startedAt ? new Date(body.startedAt) : new Date()
  const result = await schedulingFacade.onTimerStart(id, at)
  return c.json({ data: result })
})
