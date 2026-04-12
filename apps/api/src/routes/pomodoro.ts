/**
 * Pomodoro Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { createPomodoroSessionSchema, updatePomodoroSessionSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { parsePaginationLimit, parsePaginationOffset } from '../lib/utils'
import { pomodoroService } from '../services/pomodoro.service'
import { LimitExceededError } from '../lib/limits'

export const pomodoroRoutes = new OpenAPIHono<AppEnv>()

pomodoroRoutes.use('*', authMiddleware)

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// GET /sessions
// ---------------------------------------------------------------------------
const listSessionsRoute = createRoute({
  method: 'get',
  path: '/sessions',
  tags: ['Pomodoro'],
  summary: 'List pomodoro sessions',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'Sessions' },
  },
})

pomodoroRoutes.openapi(listSessionsRoute, async (c) => {
  const userId = c.get('user').userId
  const q = c.req.query()

  const isCompletedParam = q.isCompleted || q.is_completed
  const isCompleted =
    isCompletedParam === 'true' ? true : isCompletedParam === 'false' ? false : undefined

  const limit = q.limit ? parsePaginationLimit(q.limit) : 50
  const offset = q.offset ? parsePaginationOffset(q.offset) : 0

  const { sessions, count } = await pomodoroService.listSessions(userId, {
    sessionType: (q.sessionType || q.session_type) as any,
    taskId: q.taskId || q.task_id || undefined,
    isCompleted,
    dateFrom: q.dateFrom || q.date_from || undefined,
    dateTo: q.dateTo || q.date_to || undefined,
    limit,
    offset,
  })

  return c.json({ data: sessions, count, limit, offset }, 200)
})

// ---------------------------------------------------------------------------
// POST /sessions
// ---------------------------------------------------------------------------
const createSessionRoute = createRoute({
  method: 'post',
  path: '/sessions',
  tags: ['Pomodoro'],
  summary: 'Create a pomodoro session',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createPomodoroSessionSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Session created' },
  },
})

pomodoroRoutes.openapi(createSessionRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  try {
    const session = await pomodoroService.createSession(userId, body)
    return c.json({ data: session }, 201)
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return c.json({ error: error.message, limitType: error.limitType }, 409)
    }
    throw error
  }
})

// ---------------------------------------------------------------------------
// GET /sessions/:id
// ---------------------------------------------------------------------------
const getSessionRoute = createRoute({
  method: 'get',
  path: '/sessions/:id',
  tags: ['Pomodoro'],
  summary: 'Get a pomodoro session',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Session' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

pomodoroRoutes.openapi(getSessionRoute, async (c) => {
  const userId = c.get('user').userId
  const session = await pomodoroService.getSession(userId, c.req.param('id'))
  if (!session) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: session }, 200)
})

// ---------------------------------------------------------------------------
// PATCH /sessions/:id
// ---------------------------------------------------------------------------
const updateSessionRoute = createRoute({
  method: 'patch',
  path: '/sessions/:id',
  tags: ['Pomodoro'],
  summary: 'Update a pomodoro session',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updatePomodoroSessionSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

pomodoroRoutes.openapi(updateSessionRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const session = await pomodoroService.updateSession(userId, c.req.param('id'), body)
  if (!session) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: session }, 200)
})

// ---------------------------------------------------------------------------
// DELETE /sessions/:id
// ---------------------------------------------------------------------------
const deleteSessionRoute = createRoute({
  method: 'delete',
  path: '/sessions/:id',
  tags: ['Pomodoro'],
  summary: 'Delete a pomodoro session',
  security: [{ Bearer: [] }],
  responses: {
    204: { description: 'Deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

pomodoroRoutes.openapi(deleteSessionRoute, async (c) => {
  const userId = c.get('user').userId
  const deleted = await pomodoroService.deleteSession(userId, c.req.param('id'))
  if (!deleted) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})

// ---------------------------------------------------------------------------
// GET /stats
// ---------------------------------------------------------------------------
const statsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Pomodoro'],
  summary: 'Get pomodoro stats',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Stats' },
  },
})

pomodoroRoutes.openapi(statsRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await pomodoroService.getStats(userId)
  return c.json({ data }, 200)
})
