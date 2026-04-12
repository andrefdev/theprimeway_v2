import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { featuresRepo } from '../repositories/features.repo'
import { bustFeatureCache } from '../services/features.service'
import { FEATURES } from '@repo/shared/constants'
import { prisma } from '../lib/prisma'

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
