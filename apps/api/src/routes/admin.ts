import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { featuresRepo } from '../repositories/features.repo'
import { plansRepo, type PlanRow } from '../repositories/plans.repo'
import { bustFeatureCache } from '../services/features.service'
import { FEATURES } from '@repo/shared/constants'
import { prisma } from '../lib/prisma'
import { sendPushSchema } from '@repo/shared/validators'
import { notificationsService } from '../services/notifications.service'

export const adminRoutes = new OpenAPIHono<AppEnv>()

// Admin auth middleware — verifies user has role='admin'
const adminMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('user').userId
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
})

adminRoutes.use('*', authMiddleware)
adminRoutes.use('*', adminMiddleware)

// PUT /api/admin/users/:userId/features/:featureKey
const putOverrideRoute = createRoute({
  method: 'put',
  path: '/users/:userId/features/:featureKey',
  tags: ['Admin'],
  summary: 'Set feature override for a user',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            enabled: z.boolean(),
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Override set' },
    400: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Invalid key' },
  },
})

adminRoutes.openapi(putOverrideRoute, async (c) => {
  const { userId, featureKey } = c.req.param()
  const adminId = c.get('user').userId
  const { enabled, reason } = c.req.valid('json')

  // Validate featureKey is a known key
  if (!(Object.values(FEATURES) as string[]).includes(featureKey)) {
    return c.json({ error: `Unknown feature key: ${featureKey}` }, 400)
  }

  const result = await featuresRepo.upsertOverride(userId, featureKey, enabled, reason ?? null, adminId)
  bustFeatureCache(userId)
  return c.json({ data: result }, 200)
})

// DELETE /api/admin/users/:userId/features/:featureKey
const deleteOverrideRoute = createRoute({
  method: 'delete',
  path: '/users/:userId/features/:featureKey',
  tags: ['Admin'],
  summary: 'Remove feature override for a user',
  security: [{ Bearer: [] }],
  responses: {
    200: { description: 'Override removed' },
  },
})

adminRoutes.openapi(deleteOverrideRoute, async (c) => {
  const { userId, featureKey } = c.req.param()
  await featuresRepo.deleteOverride(userId, featureKey)
  bustFeatureCache(userId)
  return c.json({ data: null }, 200)
})

// GET /api/admin/users/:userId/features  — list current overrides
const getOverridesRoute = createRoute({
  method: 'get',
  path: '/users/:userId/features',
  tags: ['Admin'],
  summary: 'Get feature overrides for a user',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                userId: z.string(),
                featureKey: z.string(),
                enabled: z.boolean(),
                reason: z.string().nullable(),
                createdBy: z.string().nullable(),
                id: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            ),
          }),
        },
      },
      description: 'Overrides',
    },
  },
})

adminRoutes.openapi(getOverridesRoute, async (c) => {
  const { userId } = c.req.param()
  const overrides = await featuresRepo.findOverridesByUser(userId)
  const data = overrides.map((override) => ({
    ...override,
    createdAt: override.createdAt?.toISOString() ?? '',
    updatedAt: override.updatedAt?.toISOString() ?? '',
  }))
  return c.json({ data }, 200)
})

// GET /api/admin/users — list users with pagination
const listUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  tags: ['Admin'],
  summary: 'List all users with pagination',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.string(),
                email: z.string().nullable(),
                name: z.string().nullable(),
                role: z.string(),
              }),
            ),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
      description: 'Users list',
    },
  },
})

adminRoutes.openapi(listUsersRoute, async (c) => {
  const { page, limit, search } = c.req.valid('query')

  const where = search ? { email: { contains: search, mode: 'insensitive' as const } } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return c.json(
    {
      data: users,
      total,
      page,
      limit,
    },
    200,
  )
})

// GET /api/admin/users/:userId — get single user details
const getUserRoute = createRoute({
  method: 'get',
  path: '/users/:userId',
  tags: ['Admin'],
  summary: 'Get user details',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              id: z.string(),
              email: z.string().nullable(),
              name: z.string().nullable(),
              role: z.string(),
            }),
          }),
        },
      },
      description: 'User details',
    },
    404: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'User not found' },
  },
})

adminRoutes.openapi(getUserRoute, async (c) => {
  const { userId } = c.req.param()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(
    {
      data: user,
    },
    200,
  )
})

// GET /api/admin/users/:userId/subscription — get user subscription info
const getUserSubscriptionRoute = createRoute({
  method: 'get',
  path: '/users/:userId/subscription',
  tags: ['Admin'],
  summary: 'Get user subscription details',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              userId: z.string(),
              planTier: z.string(),
              status: z.string(),
              currentPeriodStart: z.string().nullable(),
              currentPeriodEnd: z.string().nullable(),
            }),
          }),
        },
      },
      description: 'User subscription',
    },
    404: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'User not found' },
  },
})

adminRoutes.openapi(getUserSubscriptionRoute, async (c) => {
  const { userId } = c.req.param()

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Get active subscription with plan details
  const subscription = await prisma.userSubscription.findFirst({
    where: { userId },
    include: { plan: { select: { name: true } } },
    orderBy: { id: 'desc' },
  })

  // Determine plan tier based on subscription status
  let planTier = 'free'
  let status = 'inactive'

  if (subscription) {
    status = subscription.status ?? 'pending'
    if (subscription.status === 'active') {
      planTier = 'premium'
    } else if (subscription.status === 'trialing') {
      planTier = 'trial'
    }
  }

  return c.json(
    {
      data: {
        userId,
        planTier,
        status,
        currentPeriodStart: subscription?.startsAt ? subscription.startsAt.toISOString() : null,
        currentPeriodEnd: subscription?.endsAt ? subscription.endsAt.toISOString() : null,
      },
    },
    200,
  )
})

// ---------------------------------------------------------------------------
// Plans CRUD — /api/admin/plans
// ---------------------------------------------------------------------------

const planBodySchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  billingInterval: z.enum(['monthly', 'yearly', 'lifetime']).default('monthly'),
  lemonSqueezyProductId: z.string().nullable().optional(),
  lemonSqueezyVariantId: z.string().nullable().optional(),
  trialPeriodDays: z.number().int().nonnegative().nullable().optional(),
  maxHabits: z.number().int().nullable().optional(),
  maxGoals: z.number().int().nullable().optional(),
  maxNotes: z.number().int().nullable().optional(),
  maxTasks: z.number().int().nullable().optional(),
  maxPomodoroSessionsDaily: z.number().int().nullable().optional(),
  hasAiAssistant: z.boolean().optional(),
  hasReadingModule: z.boolean().optional(),
  hasFinancesModule: z.boolean().optional(),
  hasNotesModule: z.boolean().optional(),
  hasAdvancedAnalytics: z.boolean().optional(),
  hasCustomThemeCreation: z.boolean().optional(),
  hasExportData: z.boolean().optional(),
  hasPrioritySupport: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

const planUpdateSchema = planBodySchema.partial()

function serializePlan(p: PlanRow) {
  return { ...p, price: Number(p.price) }
}

// GET /plans — list
const listPlansRoute = createRoute({
  method: 'get',
  path: '/plans',
  tags: ['Admin'],
  summary: 'List subscription plans',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      includeInactive: z.coerce.boolean().optional().default(false),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      description: 'Plans list',
    },
  },
})

adminRoutes.openapi(listPlansRoute, async (c) => {
  const { includeInactive } = c.req.valid('query')
  const plans = await plansRepo.list({ includeInactive })
  return c.json({ data: plans.map(serializePlan) }, 200)
})

// GET /plans/:id
const getPlanRoute = createRoute({
  method: 'get',
  path: '/plans/:id',
  tags: ['Admin'],
  summary: 'Get plan by id',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Plan' },
    404: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Not found' },
  },
})

adminRoutes.openapi(getPlanRoute, async (c) => {
  const { id } = c.req.param()
  const plan = await plansRepo.findById(id)
  if (!plan) return c.json({ error: 'Plan not found' }, 404)
  return c.json({ data: serializePlan(plan) }, 200)
})

// POST /plans — create
const createPlanRoute = createRoute({
  method: 'post',
  path: '/plans',
  tags: ['Admin'],
  summary: 'Create a subscription plan',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: planBodySchema } } },
  },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Created' },
    409: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Conflict' },
  },
})

adminRoutes.openapi(createPlanRoute, async (c) => {
  const body = c.req.valid('json')
  try {
    const created = await plansRepo.create({
      ...body,
      price: body.price,
    } as any)
    return c.json({ data: serializePlan(created) }, 201)
  } catch (e: any) {
    if (e?.code === 'P2002') return c.json({ error: 'Duplicate lemonSqueezyVariantId' }, 409)
    throw e
  }
})

// PUT /plans/:id — update
const updatePlanRoute = createRoute({
  method: 'put',
  path: '/plans/:id',
  tags: ['Admin'],
  summary: 'Update a subscription plan',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: planUpdateSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
    404: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Not found' },
    409: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Conflict' },
  },
})

adminRoutes.openapi(updatePlanRoute, async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const existing = await plansRepo.findById(id)
  if (!existing) return c.json({ error: 'Plan not found' }, 404)
  try {
    const updated = await plansRepo.update(id, body as any)
    return c.json({ data: serializePlan(updated) }, 200)
  } catch (e: any) {
    if (e?.code === 'P2002') return c.json({ error: 'Duplicate lemonSqueezyVariantId' }, 409)
    throw e
  }
})

// DELETE /plans/:id — soft delete (deactivate) by default; hard-delete with ?hard=true
const deletePlanRoute = createRoute({
  method: 'delete',
  path: '/plans/:id',
  tags: ['Admin'],
  summary: 'Delete (deactivate) a subscription plan',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({ hard: z.coerce.boolean().optional().default(false) }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Deleted' },
    404: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Not found' },
    409: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Conflict' },
  },
})

adminRoutes.openapi(deletePlanRoute, async (c) => {
  const { id } = c.req.param()
  const { hard } = c.req.valid('query')
  const existing = await plansRepo.findById(id)
  if (!existing) return c.json({ error: 'Plan not found' }, 404)

  if (hard) {
    const inUse = await plansRepo.countActiveSubscriptions(id)
    if (inUse > 0) {
      return c.json({ error: `Plan is referenced by ${inUse} active subscription(s); deactivate instead.` }, 409)
    }
    await plansRepo.hardDelete(id)
    return c.json({ data: { id, deleted: 'hard' } }, 200)
  }

  const deactivated = await plansRepo.setActive(id, false)
  return c.json({ data: serializePlan(deactivated) }, 200)
})

// ---------------------------------------------------------------------------
// PUT /api/admin/users/:userId/subscription — manually set user subscription
// ---------------------------------------------------------------------------
const setUserSubscriptionRoute = createRoute({
  method: 'put',
  path: '/users/:userId/subscription',
  tags: ['Admin'],
  summary: 'Manually set or update a user subscription',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            planId: z.string().nullable(),
            status: z.enum(['active', 'trialing', 'cancelled', 'expired', 'pending']).default('active'),
            endsAt: z.string().nullable().optional(),
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      description: 'Subscription updated',
    },
    404: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Not found',
    },
  },
})

adminRoutes.openapi(setUserSubscriptionRoute, async (c) => {
  const { userId } = c.req.param()
  const body = await c.req.json()
  const { planId, status, endsAt, reason } = body as {
    planId: string | null
    status: string
    endsAt?: string | null
    reason?: string
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  let plan: { id: string; price: unknown; currency: string; billingInterval: string } | null = null
  if (planId) {
    const found = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!found) return c.json({ error: 'Plan not found' }, 404)
    plan = { id: found.id, price: found.price, currency: found.currency, billingInterval: found.billingInterval }
  }

  const adminUserId = c.get('user').userId
  const existing = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { id: 'desc' },
  })

  const now = new Date()
  const metadata = {
    source: 'manual',
    setBy: adminUserId,
    setAt: now.toISOString(),
    reason: reason ?? null,
  }

  const subscription = existing
    ? await prisma.userSubscription.update({
        where: { id: existing.id },
        data: {
          planId: plan?.id ?? null,
          status,
          endsAt: endsAt ? new Date(endsAt) : existing.endsAt,
          metadata,
          updatedAt: now,
        },
      })
    : await prisma.userSubscription.create({
        data: {
          userId,
          planId: plan?.id ?? null,
          status,
          amount: (plan?.price as any) ?? 0,
          currency: plan?.currency ?? 'USD',
          billingInterval: plan?.billingInterval ?? 'monthly',
          startsAt: now,
          endsAt: endsAt ? new Date(endsAt) : null,
          metadata,
        },
      })

  return c.json({ data: subscription }, 200)
})

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/summary — aggregate usage and growth metrics
// ---------------------------------------------------------------------------
const analyticsSummaryRoute = createRoute({
  method: 'get',
  path: '/analytics/summary',
  tags: ['Admin'],
  summary: 'Aggregate analytics for the admin dashboard',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      description: 'Analytics summary',
    },
  },
})

adminRoutes.openapi(analyticsSummaryRoute, async (c) => {
  const now = new Date()
  const day = 24 * 60 * 60 * 1000
  const since7d = new Date(now.getTime() - 7 * day)
  const since30d = new Date(now.getTime() - 30 * day)

  const [
    totalUsers,
    admins,
    subscriptionsByStatus,
    subscriptionsByPlan,
    activeFeatureOverrides,
    usageAgg,
    dau,
    mau,
    tasksLast30d,
    habitsLast30d,
    notesLast30d,
    pomodoroLast30d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.userSubscription.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.userSubscription.groupBy({ by: ['planId'], _count: { _all: true } }),
    prisma.userFeatureOverride.groupBy({
      by: ['featureKey', 'enabled'],
      _count: { _all: true },
    }),
    prisma.userUsageStat.aggregate({
      _sum: {
        currentHabits: true,
        currentGoals: true,
        currentNotes: true,
        currentTasks: true,
        dailyPomodoroSessions: true,
        dailyAiRequests: true,
      },
    }),
    prisma.userUsageStat.count({ where: { updatedAt: { gte: since7d } } }),
    prisma.userUsageStat.count({ where: { updatedAt: { gte: since30d } } }),
    prisma.task.count({ where: { createdAt: { gte: since30d } } }),
    prisma.habit.count({ where: { createdAt: { gte: since30d } } }),
    prisma.note.count({ where: { createdAt: { gte: since30d } } }),
    prisma.pomodoroSession.count({ where: { createdAt: { gte: since30d } } }),
  ])

  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, name: true, displayName: true },
  })
  const planById = new Map(plans.map((p) => [p.id, p]))

  const byPlan = subscriptionsByPlan.map((row) => ({
    planId: row.planId,
    planName: row.planId ? planById.get(row.planId)?.name ?? 'unknown' : 'none',
    displayName: row.planId ? planById.get(row.planId)?.displayName ?? 'Unknown' : 'No plan',
    count: row._count._all,
  }))

  const byStatus = subscriptionsByStatus.map((row) => ({
    status: row.status ?? 'unknown',
    count: row._count._all,
  }))

  // Pivot feature overrides into { featureKey, enabled, disabled }
  const overrideMap = new Map<string, { enabled: number; disabled: number }>()
  for (const row of activeFeatureOverrides) {
    const current = overrideMap.get(row.featureKey) ?? { enabled: 0, disabled: 0 }
    if (row.enabled) current.enabled += row._count._all
    else current.disabled += row._count._all
    overrideMap.set(row.featureKey, current)
  }
  const featureOverrides = Array.from(overrideMap.entries()).map(([featureKey, counts]) => ({
    featureKey,
    ...counts,
  }))

  return c.json(
    {
      data: {
        users: {
          total: totalUsers,
          admins,
          dau7d: dau,
          mau30d: mau,
        },
        subscriptions: {
          byStatus,
          byPlan,
        },
        usage: {
          totalHabits: usageAgg._sum.currentHabits ?? 0,
          totalGoals: usageAgg._sum.currentGoals ?? 0,
          totalNotes: usageAgg._sum.currentNotes ?? 0,
          totalTasks: usageAgg._sum.currentTasks ?? 0,
          dailyPomodoroSessions: usageAgg._sum.dailyPomodoroSessions ?? 0,
          dailyAiRequests: usageAgg._sum.dailyAiRequests ?? 0,
        },
        growth30d: {
          tasks: tasksLast30d,
          habits: habitsLast30d,
          notes: notesLast30d,
          pomodoro: pomodoroLast30d,
        },
        featureOverrides,
      },
    },
    200,
  )
})

// ---------------------------------------------------------------------------
// POST /api/admin/notifications/push — send custom FCM push to all or specific users
// ---------------------------------------------------------------------------
const sendPushRoute = createRoute({
  method: 'post',
  path: '/notifications/push',
  tags: ['Admin'],
  summary: 'Send a push notification to all users or a subset',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: sendPushSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Sent' },
    400: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Invalid' },
  },
})

adminRoutes.openapi(sendPushRoute, async (c) => {
  const body = c.req.valid('json')
  const result = await notificationsService.sendPush(body)
  if ('error' in result) return c.json({ error: 'Missing title or body' }, 400)
  return c.json(result, 200)
})
