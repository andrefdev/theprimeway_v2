import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { featuresService } from '../services/features.service'

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
