import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { featuresService } from '../services/features.service'
import { getAllUsage } from '../lib/usage'

export const featuresRoutes = new OpenAPIHono<AppEnv>()
featuresRoutes.use('*', authMiddleware)

const getFeaturesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Features'],
  summary: 'Get resolved feature set for authenticated user',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.record(z.any()),
            resolvedAt: z.string(),
          }),
        },
      },
      description: 'Resolved features',
    },
  },
})

featuresRoutes.openapi(getFeaturesRoute, async (c) => {
  const userId = c.get('user').userId
  const appVersion = c.req.header('X-App-Version') ?? undefined
  const data = await featuresService.resolveFeatures(userId, appVersion)
  return c.json({ data, resolvedAt: new Date().toISOString() }, 200)
})

const getUsageRoute = createRoute({
  method: 'get',
  path: '/usage',
  tags: ['Features'],
  summary: 'Get current usage counts vs plan limits',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.record(
              z.object({
                current: z.number(),
                limit: z.number(),
              }),
            ),
          }),
        },
      },
      description: 'Usage report',
    },
  },
})

featuresRoutes.openapi(getUsageRoute, async (c) => {
  const userId = c.get('user').userId
  const appVersion = c.req.header('X-App-Version') ?? undefined
  const [features, usage] = await Promise.all([
    featuresService.resolveFeatures(userId, appVersion),
    getAllUsage(userId),
  ])
  const data: Record<string, { current: number; limit: number }> = {}
  for (const [key, current] of Object.entries(usage)) {
    const f = (features as any)[key]
    const limit = typeof f?.limit === 'number' ? f.limit : 0
    data[key] = { current, limit }
  }
  return c.json({ data }, 200)
})
