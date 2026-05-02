import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { featuresRepo } from '../repositories/features.repo'
import { plansRepo, type PlanRow } from '../repositories/plans.repo'
import { bustAllFeatureCaches, bustFeatureCache } from '../services/features.service'
import { FEATURES } from '@repo/shared/constants'
import { sendPushSchema } from '@repo/shared/validators'
import { notificationsService } from '../services/notifications.service'
import { adminService } from '../services/admin.service'

export const adminRoutes = new OpenAPIHono<AppEnv>()

// Admin auth middleware — verifies user has role='admin'
const adminMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('user').userId
  const ok = await adminService.isAdmin(userId)
  if (!ok) return c.json({ error: 'Forbidden' }, 403)
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
  const [users, total] = await adminService.listUsers({ page, limit, search })
  return c.json({ data: users, total, page, limit }, 200)
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
  const user = await adminService.getUser(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ data: user }, 200)
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
  const result = await adminService.getUserSubscription(userId)
  if (!result.ok) return c.json({ error: 'User not found' }, 404)
  return c.json({ data: result.data }, 200)
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
  maxTasks: z.number().int().nullable().optional(),
  maxPomodoroSessionsDaily: z.number().int().nullable().optional(),
  maxBrainEntries: z.number().int().nullable().optional(),
  hasAiAssistant: z.boolean().optional(),
  hasBrainModule: z.boolean().optional(),
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

// GET /plans/free — get (or auto-create) the global free plan defaults
const getFreePlanRoute = createRoute({
  method: 'get',
  path: '/plans/free',
  tags: ['Admin'],
  summary: 'Get or initialize the global free plan defaults',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Free plan' },
  },
})

adminRoutes.openapi(getFreePlanRoute, async (c) => {
  const free = await plansRepo.ensureFreePlan()
  return c.json({ data: serializePlan(free) }, 200)
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

  const isFree = existing.name === 'free'
  if (isFree && body.name && body.name !== 'free') {
    return c.json({ error: 'Cannot rename the global free plan.' }, 409)
  }
  if (isFree && body.isActive === false) {
    return c.json({ error: 'Free plan cannot be deactivated.' }, 409)
  }

  try {
    const updated = await plansRepo.update(id, body as any)
    if (isFree) bustAllFeatureCaches()
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
  if (existing.name === 'free') {
    return c.json({ error: 'Free plan cannot be deleted; edit it to change defaults.' }, 409)
  }

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
  const adminUserId = c.get('user').userId
  const result = await adminService.setUserSubscription(userId, { planId, status, endsAt, reason, adminUserId })
  if (!result.ok) {
    return c.json({ error: result.reason === 'plan_not_found' ? 'Plan not found' : 'User not found' }, 404)
  }
  return c.json({ data: result.subscription }, 200)
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
  const data = await adminService.analyticsSummary()
  return c.json({ data }, 200)
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

// ─── Ambassador / Referral Program admin endpoints ─────────────────────────
import { ambassadorService } from '../services/ambassador.service'
import type { AmbassadorStatus } from '@prisma/client'

const VALID_STATUSES: AmbassadorStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']

adminRoutes.get('/ambassadors', async (c) => {
  const status = c.req.query('status')
  const tierId = c.req.query('tierId')
  const search = c.req.query('search')
  const skip = Number(c.req.query('skip') || 0)
  const take = Number(c.req.query('take') || 50)
  const data = await ambassadorService.list({
    status: status && (VALID_STATUSES as string[]).includes(status) ? (status as AmbassadorStatus) : undefined,
    tierId: tierId || undefined,
    search: search || undefined,
    skip,
    take,
  })
  return c.json({ data })
})

adminRoutes.get('/ambassadors/:id', async (c) => {
  const data = await ambassadorService.detail(c.req.param('id'))
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

adminRoutes.post('/ambassadors/:id/approve', async (c) => {
  const adminId = (c as any).get('user').userId
  try {
    const data = await ambassadorService.approve(c.req.param('id'), adminId)
    return c.json({ data })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

adminRoutes.post('/ambassadors/:id/reject', async (c) => {
  const adminId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : null
  if (!reason) return c.json({ error: 'reason requerido' }, 400)
  try {
    const data = await ambassadorService.reject(c.req.param('id'), adminId, reason)
    return c.json({ data })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

adminRoutes.patch('/ambassadors/:id/tier', async (c) => {
  const adminId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const tierId = typeof body.tierId === 'string' ? body.tierId : null
  if (!tierId) return c.json({ error: 'tierId requerido' }, 400)
  try {
    const data = await ambassadorService.setTier(c.req.param('id'), tierId, adminId)
    return c.json({ data })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

adminRoutes.patch('/ambassadors/:id/commission', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const pct = body.commissionPct === null ? null : typeof body.commissionPct === 'number' ? body.commissionPct : NaN
  if (pct !== null && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
    return c.json({ error: 'commissionPct inválido (0-100 o null)' }, 400)
  }
  const data = await ambassadorService.setCommissionOverride(c.req.param('id'), pct)
  return c.json({ data })
})

adminRoutes.post('/ambassadors/:id/suspend', async (c) => {
  const data = await ambassadorService.suspend(c.req.param('id'))
  return c.json({ data })
})

adminRoutes.get('/ambassadors/:id/payouts/owed', async (c) => {
  const data = await ambassadorService.owedForAmbassador(c.req.param('id'))
  return c.json({ data })
})

adminRoutes.post('/ambassadors/:id/payouts', async (c) => {
  const adminId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const amountCents = typeof body.amountCents === 'number' ? body.amountCents : NaN
  const method = typeof body.method === 'string' ? body.method : ''
  if (!Number.isInteger(amountCents) || amountCents <= 0) return c.json({ error: 'amountCents inválido' }, 400)
  if (!['paypal', 'wise', 'bank', 'manual'].includes(method)) return c.json({ error: 'method inválido' }, 400)
  const data = await ambassadorService.registerPayout(c.req.param('id'), adminId, {
    amountCents,
    method,
    externalRef: typeof body.externalRef === 'string' ? body.externalRef : undefined,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
  })
  return c.json({ data })
})

adminRoutes.get('/ambassador-tiers', async (c) => {
  const data = await ambassadorService.listTiers()
  return c.json({ data })
})

adminRoutes.patch('/ambassador-tiers/:id', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const patch: { name?: string; minActiveReferrals?: number; commissionPct?: number; perks?: string[]; badgeColor?: string } = {}
  if (typeof body.name === 'string') patch.name = body.name
  if (typeof body.minActiveReferrals === 'number') patch.minActiveReferrals = body.minActiveReferrals
  if (typeof body.commissionPct === 'number') patch.commissionPct = body.commissionPct
  if (Array.isArray(body.perks)) patch.perks = body.perks.filter((p: unknown): p is string => typeof p === 'string')
  if (typeof body.badgeColor === 'string') patch.badgeColor = body.badgeColor
  const data = await ambassadorService.updateTier(c.req.param('id'), patch)
  return c.json({ data })
})
