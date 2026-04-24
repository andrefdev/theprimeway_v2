import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { fatigueService } from '../services/fatigue.service'

export const fatigueRoutes = new OpenAPIHono()
fatigueRoutes.use('*', authMiddleware)

fatigueRoutes.get('/', async (c) => {
  const userId = (c as any).get('user').userId
  const windowDaysParam = c.req.query('windowDays')
  const windowDays = windowDaysParam ? Math.max(1, Math.min(30, Number(windowDaysParam))) : 7
  const data = await fatigueService.analyze(userId, windowDays)
  return c.json({ data })
})
