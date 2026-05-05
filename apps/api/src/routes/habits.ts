/**
 * Habits Routes — HTTP layer (thin controller)
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
import { habitsService } from '../services/habits.service'
import { LimitExceededError } from '../lib/limits'
import { parsePaginationLimit } from '../lib/utils'

export const habitRoutes = new OpenAPIHono<AppEnv>()

// Apply auth middleware to all routes
habitRoutes.use('*', authMiddleware)

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------
const errorResponse = z.object({ error: z.string() })

const habitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  userId: z.string(),
  date: z.string(),
  completedCount: z.number(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const habitSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  targetFrequency: z.number(),
  frequencyType: z.string(),
  weekDays: z.array(z.number()),
  isActive: z.boolean(),
  goalId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  logs: z.array(habitLogSchema).optional(),
}).passthrough()

// ---------------------------------------------------------------------------
// GET /habits — List habits
// ---------------------------------------------------------------------------
const getHabitsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Habits'],
  summary: 'List habits with optional filters',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      isActive: z.string().optional(),
      category: z.string().optional(),
      goalId: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
      includeLogs: z.string().optional(),
      applicableDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(habitSchema),
            count: z.number(),
          }),
        },
      },
      description: 'List of habits',
    },
    400: { content: { 'application/json': { schema: z.any() } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(getHabitsRoute, async (c) => {
  const { userId } = c.get('user')
  const query = c.req.valid('query')

  try {
    const result = await habitsService.listHabits(userId, {
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      category: query.category || undefined,
      goalId: query.goalId || undefined,
      limit: query.limit ? parsePaginationLimit(query.limit) : 50,
      offset: query.offset ? parseInt(query.offset) : 0,
      includeLogs: query.includeLogs === 'true',
      applicableDate: query.applicableDate || undefined,
    })

    return c.json(result as any, 200)
  } catch (error) {
    console.error('[HABITS_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /habits — Create a new habit
// ---------------------------------------------------------------------------
const createHabitBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  targetFrequency: z.number().int().min(1).default(1),
  frequencyType: z.enum(['daily', 'week_days', 'times_per_week']).default('daily'),
  weekDays: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().default(true),
  goalId: z.string().optional(),
})

const postHabitRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Habits'],
  summary: 'Create a new habit',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: createHabitBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: habitSchema } }, description: 'Created habit' },
    400: { content: { 'application/json': { schema: z.any() } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(postHabitRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const body = c.req.valid('json')
    const habit = await habitsService.createHabit(userId, body)
    return c.json(habit as any, 200)
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return c.json({ error: error.message, code: 'limit_exceeded', limitType: error.limitType }, 409)
    }
    if (error instanceof Error && error.message.includes('Goal not found')) {
      return c.json({ error: error.message }, 400)
    }
    console.error('[HABITS_POST]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /habits/stats — Habit statistics
// ---------------------------------------------------------------------------
const getHabitStatsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Habits'],
  summary: 'Get habit statistics',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).optional(),
      habitId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            totalHabits: z.number(),
            totalCompletedToday: z.number(),
            completionRate: z.number(),
            streaks: z.object({
              longest: z.array(z.any()),
              current: z.array(z.any()),
            }),
            dailyProgress: z.array(z.object({
              date: z.string(),
              totalHabits: z.number(),
              completedHabits: z.number(),
              completionRate: z.number(),
            })),
            habitDetails: z.array(z.any()),
          }),
        },
      },
      description: 'Habit stats',
    },
    400: { content: { 'application/json': { schema: z.any() } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(getHabitStatsRoute, async (c) => {
  const { userId } = c.get('user')
  const query = c.req.valid('query')

  try {
    const stats = await habitsService.getStats(
      userId,
      query.period || 'month',
      query.habitId || undefined,
    )
    return c.json(stats as any, 200)
  } catch (error) {
    console.error('[HABIT_STATS_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /habits/ai/suggestions — Suggest habits based on goals
// ---------------------------------------------------------------------------
const suggestHabitsRoute = createRoute({
  method: 'get',
  path: '/ai/suggestions',
  tags: ['Habits - AI'],
  summary: 'Get AI-suggested habits based on user goals',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              suggestions: z.array(z.object({
                name: z.string(),
                description: z.string(),
                frequency: z.string(),
                targetFrequency: z.number(),
                goalTitle: z.string(),
                goalId: z.string(),
              })),
            }),
          }),
        },
      },
      description: 'Habit suggestions',
    },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to generate suggestions' },
  },
})

habitRoutes.openapi(suggestHabitsRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const result = await habitsService.suggestHabitsForGoals(userId)
    return c.json({ data: result }, 200)
  } catch (err) {
    console.error('[HABIT_SUGGEST]', err)
    return c.json({ error: 'Failed to generate suggestions' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /habits/ai/stacking — Suggest habit stacking patterns
// ---------------------------------------------------------------------------
const habitStackingRoute = createRoute({
  method: 'get',
  path: '/ai/stacking',
  tags: ['Habits - AI'],
  summary: 'Get AI-suggested habit stacking patterns',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              stacks: z.array(z.object({
                anchor: z.string(),
                anchorId: z.string(),
                newHabit: z.string(),
                reason: z.string(),
              })),
            }),
          }),
        },
      },
      description: 'Habit stacking suggestions',
    },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to generate stacking suggestions' },
  },
})

habitRoutes.openapi(habitStackingRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const result = await habitsService.suggestHabitStacking(userId)
    return c.json({ data: result }, 200)
  } catch (err) {
    console.error('[HABIT_STACKING]', err)
    return c.json({ error: 'Failed to generate stacking suggestions' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /habits/ai/correlations — Analyze habit-productivity correlations
// ---------------------------------------------------------------------------
const correlationsRoute = createRoute({
  method: 'get',
  path: '/ai/correlations',
  tags: ['Habits - AI'],
  summary: 'Analyze habit-productivity correlations',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              correlations: z.array(z.object({
                pattern: z.string(),
                strength: z.enum(['strong', 'moderate', 'weak']),
                habitNames: z.array(z.string()),
                insight: z.string(),
              })),
              summary: z.string(),
            }),
          }),
        },
      },
      description: 'Correlation analysis',
    },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to analyze correlations' },
  },
})

habitRoutes.openapi(correlationsRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const data = await habitsService.analyzeCorrelations(userId)
    return c.json({ data }, 200)
  } catch (err) {
    console.error('[HABIT_CORRELATIONS]', err)
    return c.json({ error: 'Failed to analyze correlations' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /habits/streak-protection — Streak at-risk reminders (escalating urgency)
// ---------------------------------------------------------------------------
const streakProtectionSchema = z.object({
  habitId: z.string(),
  habitName: z.string(),
  currentStreak: z.number(),
  urgency: z.enum(['none', 'gentle', 'urgent', 'critical', 'minimal']),
  hoursRemaining: z.number(),
  message: z.string(),
})

const getStreakProtectionRoute = createRoute({
  method: 'get',
  path: '/streak-protection',
  tags: ['Habits'],
  summary: 'Get streak protection status for all active habits',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(streakProtectionSchema),
          }),
        },
      },
      description: 'Streak protection statuses',
    },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(getStreakProtectionRoute, async (c) => {
  const { userId } = c.get('user')

  try {
    const data = await habitsService.getStreakProtectionStatus(userId)
    return c.json({ data } as any, 200)
  } catch (error) {
    console.error('[STREAK_PROTECTION_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /habits/:id — Get a single habit
// ---------------------------------------------------------------------------
const getHabitByIdRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Habits'],
  summary: 'Get a habit by ID',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      includeLogs: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: habitSchema } }, description: 'Habit details' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(getHabitByIdRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const query = c.req.valid('query')

  try {
    const habit = await habitsService.getHabit(userId, id, query.includeLogs === 'true')
    if (!habit) return c.json({ error: 'Not Found' }, 404)
    return c.json(habit as any, 200)
  } catch (error) {
    console.error('[HABIT_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// PATCH /habits/:id — Update a habit
// ---------------------------------------------------------------------------
const updateHabitBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  targetFrequency: z.number().int().min(1).optional(),
  frequencyType: z.enum(['daily', 'week_days', 'times_per_week']).optional(),
  weekDays: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().optional(),
  goalId: z.string().nullable().optional(),
})

const patchHabitRoute = createRoute({
  method: 'patch',
  path: '/:id',
  tags: ['Habits'],
  summary: 'Update a habit',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateHabitBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: habitSchema } }, description: 'Updated habit' },
    400: { content: { 'application/json': { schema: z.any() } }, description: 'Validation error' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(patchHabitRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const body = c.req.valid('json')
    const habit = await habitsService.updateHabit(userId, id, body)
    if (!habit) return c.json({ error: 'Not Found' }, 404)
    return c.json(habit as any, 200)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Goal not found')) {
      return c.json({ error: error.message }, 400)
    }
    console.error('[HABIT_PATCH]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// DELETE /habits/:id — Delete a habit
// ---------------------------------------------------------------------------
const deleteHabitRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Habits'],
  summary: 'Delete a habit',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    204: { description: 'Habit deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(deleteHabitRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await habitsService.deleteHabit(userId, id)
    if (!deleted) return c.json({ error: 'Not Found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[HABIT_DELETE]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /habits/:id/logs — Get habit logs
// ---------------------------------------------------------------------------
const getHabitLogsRoute = createRoute({
  method: 'get',
  path: '/:id/logs',
  tags: ['Habits'],
  summary: 'Get logs for a habit',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(habitLogSchema),
            count: z.number(),
          }),
        },
      },
      description: 'Habit logs',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Habit not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(getHabitLogsRoute, async (c) => {
  const { userId } = c.get('user')
  const { id: habitId } = c.req.valid('param')
  const query = c.req.valid('query')

  try {
    const result = await habitsService.getHabitLogs(userId, habitId, {
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit ? parsePaginationLimit(query.limit) : 50,
      offset: query.offset ? parseInt(query.offset) : 0,
    })

    if (!result) return c.json({ error: 'Habit not found' }, 404)
    return c.json(result as any, 200)
  } catch (error) {
    console.error('[HABIT_LOGS_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /habits/:id/logs — Create or update a habit log
// ---------------------------------------------------------------------------
const upsertHabitLogBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  completedCount: z.number().int().min(0),
  notes: z.string().optional(),
})

const postHabitLogRoute = createRoute({
  method: 'post',
  path: '/:id/logs',
  tags: ['Habits'],
  summary: 'Upsert a habit log entry',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: upsertHabitLogBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: habitLogSchema } }, description: 'Upserted log' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error or not scheduled' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Habit not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

habitRoutes.openapi(postHabitLogRoute, async (c) => {
  const { userId } = c.get('user')
  const { id: habitId } = c.req.valid('param')

  try {
    const body = c.req.valid('json')
    const result = await habitsService.upsertHabitLog(userId, habitId, body)

    if (result.notFound) return c.json({ error: 'Habit not found' }, 404)
    if (result.error) return c.json({ error: result.error }, 400)
    return c.json(result.log as any, 200)
  } catch (error) {
    if (error instanceof Error && error.message.includes('not scheduled')) {
      return c.json({ error: error.message }, 400)
    }
    console.error('[HABIT_LOGS_POST]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// AI Endpoints
// ---------------------------------------------------------------------------

const analyzeHabitRoute = createRoute({
  method: 'get',
  path: '/:id/ai/analyze',
  tags: ['Habits - AI'],
  summary: 'Analyze habit patterns and get AI insights',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              habit: z.object({ id: z.string(), name: z.string() }),
              metrics: z.object({
                completionRate: z.number(),
                currentStreak: z.number(),
                longestStreak: z.number(),
                totalCompletions: z.number(),
                daysTracked: z.number(),
              }),
              patterns: z.object({
                bestDaysOfWeek: z.array(z.number()),
                consistencyLevel: z.enum(['excellent', 'good', 'fair', 'poor']),
              }),
              insights: z.array(z.string()),
            }),
          }),
        },
      },
      description: 'Habit analysis with insights',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Habit not found' },
  },
})

habitRoutes.openapi(analyzeHabitRoute, async (c) => {
  const { userId } = c.get('user')
  const { id: habitId } = c.req.valid('param')

  try {
    const analysis = await habitsService.analyzeHabit(userId, habitId)
    if (!analysis) return c.json({ error: 'Habit not found' }, 404)
    return c.json({ data: analysis }, 200)
  } catch (error) {
    console.error('[HABIT_ANALYZE]', error)
    const message = error instanceof Error ? error.message : 'Internal Error'
    const body = process.env.NODE_ENV !== 'production' ? { error: message } : { error: 'Internal Error' }
    return c.json(body, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /habits/:id/ai/optimal-time
// ---------------------------------------------------------------------------

const optimalReminderTimeRoute = createRoute({
  method: 'get',
  path: '/:id/ai/optimal-time',
  tags: ['Habits - AI'],
  summary: 'Get optimal reminder time for habit',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              habitId: z.string(),
              suggestedTime: z.string(),
              confidence: z.number(),
              reason: z.string(),
            }),
          }),
        },
      },
      description: 'Optimal reminder time',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Habit not found' },
  },
})

habitRoutes.openapi(optimalReminderTimeRoute, async (c) => {
  const { userId } = c.get('user')
  const { id: habitId } = c.req.valid('param')

  try {
    const result = await habitsService.getOptimalReminderTime(userId, habitId)
    if (!result) return c.json({ error: 'Habit not found' }, 404)
    return c.json({ data: result }, 200)
  } catch (error) {
    console.error('[HABIT_OPTIMAL_TIME]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /habits/:id/ai/suggest-goals
// ---------------------------------------------------------------------------

const suggestGoalsRoute = createRoute({
  method: 'post',
  path: '/:id/ai/suggest-goals',
  tags: ['Habits - AI'],
  summary: 'Get goal suggestions for this habit',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              linkedGoal: z
                .object({ id: z.string(), title: z.string() })
                .nullable(),
              suggestions: z.object({
                weeklyGoals: z.array(z.object({ id: z.string(), title: z.string(), type: z.string() })),
                quarterlyGoals: z.array(z.object({ id: z.string(), title: z.string(), type: z.string() })),
                annualGoals: z.array(z.object({ id: z.string(), title: z.string(), type: z.string() })),
              }),
            }),
          }),
        },
      },
      description: 'Goal suggestions for habit',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Habit not found' },
  },
})

habitRoutes.openapi(suggestGoalsRoute, async (c) => {
  const { userId } = c.get('user')
  const { id: habitId } = c.req.valid('param')

  try {
    const result = await habitsService.suggestGoalsForHabit(userId, habitId)
    if (!result) return c.json({ error: 'Habit not found' }, 404)
    return c.json({ data: result }, 200)
  } catch (error) {
    console.error('[HABIT_SUGGEST_GOALS]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// Habit Reminder Endpoint
// ---------------------------------------------------------------------------

const scheduleReminderRoute = createRoute({
  method: 'post',
  path: '/:id/reminder',
  tags: ['Habits - Reminders'],
  summary: 'Schedule a reminder for this habit',
  security: [{ Bearer: [] }],
  request: {
    param: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
            timezone: z.string().optional().default('UTC'),
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
            data: z.object({
              habitId: z.string(),
              reminderTime: z.string(),
              timezone: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
      description: 'Reminder scheduled successfully',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Habit not found' },
  },
})

habitRoutes.openapi(scheduleReminderRoute, async (c) => {
  const { userId } = c.get('user')
  const { id: habitId } = c.req.valid('param')
  const { time, timezone } = c.req.valid('json')

  try {
    // Verify habit exists
    const habit = await habitsService.getHabit(userId, habitId)
    if (!habit) return c.json({ error: 'Habit not found' }, 404)

    // Update or create notification preferences
    const { prisma } = await import('../lib/prisma')
    const notifPrefs = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: { habitReminderTime: time },
      create: { userId, habitReminderTime: time },
    })

    return c.json(
      {
        data: {
          habitId,
          reminderTime: time,
          timezone,
          message: `Reminder set for ${time}`,
        },
      },
      200,
    )
  } catch (error) {
    console.error('[HABIT_SCHEDULE_REMINDER]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})
