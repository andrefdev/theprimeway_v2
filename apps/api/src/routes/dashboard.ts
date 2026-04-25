/**
 * Dashboard Routes — Aggregated summary endpoint
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { dashboardService } from '../services/dashboard.service'
import type { AppEnv } from '../types/env'

export const dashboardRoutes = new OpenAPIHono<AppEnv>()

dashboardRoutes.use('*', authMiddleware)

const summaryRoute = createRoute({
  method: 'get',
  path: '/summary',
  tags: ['Dashboard'],
  summary: 'Get aggregated dashboard summary',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              tasks: z.object({
                todayTotal: z.number(),
                todayCompleted: z.number(),
                overdueCount: z.number(),
              }),
              habits: z.object({
                activeCount: z.number(),
                completedToday: z.number(),
              }),
              gamification: z.object({
                level: z.number(),
                totalXp: z.number(),
                currentStreak: z.number(),
              }),
            }),
          }),
        },
      },
      description: 'Dashboard summary',
    },
  },
})

dashboardRoutes.openapi(summaryRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await dashboardService.getSummary(userId)
  return c.json({ data }, 200)
})
