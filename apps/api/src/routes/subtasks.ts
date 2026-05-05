import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { subtasksService } from '../services/subtasks.service'

export const subtasksRoutes = new OpenAPIHono()
// NOTE: this sub-app is mounted at `/api` (not `/api/subtasks`) because it
// owns two distinct path families (`/tasks/:taskId/subtasks` and `/subtasks/:id`).
// Using `.use('*', ...)` here would attach auth to every `/api/*` request and
// break unrelated sub-apps (e.g. `/api/referral/validate/:code` returned 401).
// Scope the middleware to the actual paths instead.
subtasksRoutes.use('/tasks/:taskId/subtasks', authMiddleware)
subtasksRoutes.use('/subtasks/:id', authMiddleware)

// GET /api/tasks/:taskId/subtasks
subtasksRoutes.get('/tasks/:taskId/subtasks', async (c) => {
  const userId = (c as any).get('user').userId
  const result = await subtasksService.list(userId, c.req.param('taskId'))
  if (!result.ok) return c.json({ error: 'Task not found' }, 404)
  return c.json({ data: result.data })
})

// POST /api/tasks/:taskId/subtasks
subtasksRoutes.post('/tasks/:taskId/subtasks', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  if (typeof body.title !== 'string' || !body.title.trim()) {
    return c.json({ error: 'title is required' }, 400)
  }
  const result = await subtasksService.create(userId, c.req.param('taskId'), {
    title: body.title.trim(),
    plannedTimeMinutes: typeof body.plannedTimeMinutes === 'number' ? body.plannedTimeMinutes : undefined,
    position: typeof body.position === 'number' ? body.position : undefined,
  })
  if (!result.ok) return c.json({ error: 'Task not found' }, 404)
  return c.json({ data: result.subtask }, 201)
})

// PATCH /api/subtasks/:id
subtasksRoutes.patch('/subtasks/:id', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const result = await subtasksService.update(userId, c.req.param('id'), body)
  if (!result.ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: result.subtask })
})

// DELETE /api/subtasks/:id
subtasksRoutes.delete('/subtasks/:id', async (c) => {
  const userId = (c as any).get('user').userId
  const ok = await subtasksService.delete(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
