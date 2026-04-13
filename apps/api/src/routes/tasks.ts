/**
 * Tasks Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request (query params, body, path params)
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { tasksService } from '../services/tasks.service'
import { parsePaginationLimit, parsePaginationOffset } from '../lib/utils'
import { LimitExceededError } from '../lib/limits'

export const taskRoutes = new OpenAPIHono<AppEnv>()

taskRoutes.use('*', authMiddleware)

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const errorResponse = z.object({ error: z.string() })

const taskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  status: z.string(),
  priority: z.string(),
}).passthrough()

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  isAllDay: z.boolean().optional(),
  estimatedDuration: z.number().optional(),
  backlogState: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  weeklyGoalId: z.string().optional(),
})

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['open', 'completed']).optional(),
  archivedAt: z.string().nullable().optional(),
  orderInDay: z.number().optional(),
})

// ---------------------------------------------------------------------------
// GET /api/tasks
// ---------------------------------------------------------------------------
const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tasks'],
  summary: 'List tasks with filters',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(taskSchema), count: z.number() }) } }, description: 'Tasks list' },
  },
})

taskRoutes.openapi(listRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const q = c.req.query()

  const result = await tasksService.listTasks(userId, {
    filter: q.filter as any,
    status: q.status,
    priority: q.priority,
    referenceDate: q.referenceDate || q.reference_date,
    weeklyGoalId: q.weeklyGoalId || q.weekly_goal_id,
    weekStart: q.weekStart || q.week_start,
    weekEnd: q.weekEnd || q.week_end,
    limit: parsePaginationLimit(q.limit),
    offset: parsePaginationOffset(q.offset),
  })

  return c.json(result, 200)
}) as any)

// ---------------------------------------------------------------------------
// POST /api/tasks
// ---------------------------------------------------------------------------
const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['Tasks'],
  summary: 'Create a new task',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createTaskSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: taskSchema }) } }, description: 'Task created' },
  },
})

taskRoutes.openapi(createRoute_, (async (c: any) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')
  try {
    const task = await tasksService.createTask(userId, body)
    return c.json({ data: task }, 201)
  } catch (err: any) {
    if (err instanceof LimitExceededError) {
      return c.json({ error: err.message, limitType: err.limitType }, 409)
    }
    throw err
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /api/tasks/grouped
// ---------------------------------------------------------------------------
const groupedRoute = createRoute({
  method: 'get',
  path: '/grouped',
  tags: ['Tasks'],
  summary: 'Get tasks grouped by date',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ groups: z.array(z.any()), archive: z.array(taskSchema) }) } }, description: 'Grouped tasks' },
  },
})

taskRoutes.openapi(groupedRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const referenceDate = c.req.query('referenceDate') || c.req.query('reference_date')

  if (!referenceDate) {
    return c.json({ error: 'referenceDate query param is required' }, 400)
  }

  const result = await tasksService.getGroupedTasks(userId, referenceDate)
  return c.json(result, 200)
}) as any)

// ---------------------------------------------------------------------------
// GET /api/tasks/schedule/suggest
// ---------------------------------------------------------------------------
const scheduleRoute = createRoute({
  method: 'get',
  path: '/schedule/suggest',
  tags: ['Tasks'],
  summary: 'Get schedule suggestions for a task',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.object({ start: z.string(), end: z.string() }).nullable() }) } }, description: 'Schedule suggestion' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid request' },
  },
})

taskRoutes.openapi(scheduleRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const targetDate = c.req.query('targetDate') || c.req.query('target_date')
  const estimatedDuration = c.req.query('estimatedDuration') || c.req.query('estimated_duration')
  const preferredTime = c.req.query('preferredTime') || c.req.query('preferred_time')

  if (!targetDate) {
    return c.json({ error: 'targetDate query param is required' }, 400)
  }

  if (!estimatedDuration) {
    return c.json({ error: 'estimatedDuration query param is required' }, 400)
  }

  const duration = Number(estimatedDuration)
  if (isNaN(duration) || duration <= 0) {
    return c.json({ error: 'estimatedDuration must be a positive number' }, 400)
  }

  if (preferredTime && !['morning', 'afternoon', 'evening'].includes(preferredTime)) {
    return c.json({ error: 'preferredTime must be morning, afternoon, or evening' }, 400)
  }

  try {
    const suggestion = await tasksService.getScheduleSuggestion(
      userId,
      targetDate,
      duration,
      preferredTime as 'morning' | 'afternoon' | 'evening' | undefined,
    )
    return c.json({ data: suggestion }, 200)
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to get schedule suggestion' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /api/tasks/:id
// ---------------------------------------------------------------------------
const getRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Tasks'],
  summary: 'Get a single task',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: taskSchema }) } }, description: 'Task found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

taskRoutes.openapi(getRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const task = await tasksService.getTask(userId, c.req.param('id'))
  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json({ data: task }, 200)
}) as any)

// ---------------------------------------------------------------------------
// PUT /api/tasks/:id
// ---------------------------------------------------------------------------
const updateRoute = createRoute({
  method: 'put',
  path: '/:id',
  tags: ['Tasks'],
  summary: 'Update a task',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updateTaskSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: taskSchema }) } }, description: 'Task updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

taskRoutes.openapi(updateRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const task = await tasksService.updateTask(userId, c.req.param('id'), body)
    if (!task) return c.json({ error: 'Task not found' }, 404)
    return c.json({ data: task }, 200)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:id
// ---------------------------------------------------------------------------
const deleteRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Tasks'],
  summary: 'Delete a task',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'Task deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

taskRoutes.openapi(deleteRoute, async (c) => {
  const { userId } = c.get('user')
  const deleted = await tasksService.deleteTask(userId, c.req.param('id'))
  if (!deleted) return c.json({ error: 'Task not found' }, 404)
  return c.json({ success: true }, 200)
})

// ---------------------------------------------------------------------------
// POST /api/tasks/ai/timebox
// ---------------------------------------------------------------------------
const timeboxRoute = createRoute({
  method: 'post',
  path: '/ai/timebox',
  tags: ['Tasks', 'AI'],
  summary: 'Estimate task duration using AI',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string(),
            description: z.string().optional(),
            taskId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            minutes: z.number(),
            rationale: z.string(),
          }),
        },
      },
      description: 'Timebox estimate',
    },
    400: {
      content: {
        'application/json': {
          schema: errorResponse,
        },
      },
      description: 'Failed to estimate timebox',
    },
  },
})

taskRoutes.openapi(timeboxRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { title, description, taskId } = c.req.valid('json')

  try {
    const result = await tasksService.estimateTimebox(userId, title, description, taskId)
    return c.json({ data: result }, 200)
  } catch (err) {
    console.error('[TIMEBOX_ERROR]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: 'Failed to estimate timebox', details: message }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// POST /api/tasks/ai/schedule
// ---------------------------------------------------------------------------
const aiScheduleRoute = createRoute({
  method: 'post',
  path: '/ai/schedule',
  tags: ['Tasks', 'AI'],
  summary: 'Find optimal time slot for task',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            taskId: z.string(),
            duration: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            slot: z
              .object({
                start: z.string(),
                end: z.string(),
              })
              .nullable(),
            confidence: z.number(),
          }),
        },
      },
      description: 'Scheduling suggestion',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Task not found' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to schedule task' },
  },
})

taskRoutes.openapi(aiScheduleRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { taskId, duration } = c.req.valid('json')

  const result = await tasksService.scheduleTask(userId, taskId, duration)
  return c.json(result, 200)
}) as any)

// ---------------------------------------------------------------------------
// GET /api/tasks/ai/insight/:taskId
// ---------------------------------------------------------------------------
const insightRoute = createRoute({
  method: 'get',
  path: '/ai/insight/:taskId',
  tags: ['Tasks', 'AI'],
  summary: 'Get AI insights for a task',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            contextBrief: z.string(),
            suggestedSubtasks: z.array(z.string()),
            tips: z.array(z.string()),
          }),
        },
      },
      description: 'Task insights',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Task not found' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to generate insights' },
  },
})

taskRoutes.openapi(insightRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const taskId = c.req.param('taskId')

  try {
    const result = await tasksService.getTaskInsight(userId, taskId)
    return c.json(result, 200)
  } catch (err) {
    return c.json({ error: 'Failed to generate insights' }, 400)
  }
}) as any)
