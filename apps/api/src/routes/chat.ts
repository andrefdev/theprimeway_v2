/**
 * Chat Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { chatMessageSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { requireFeature } from '../middleware/feature-gate'
import { chatService } from '../services/chat.service'
import type { AppEnv } from '../types/env'
import { FEATURES } from '@repo/shared/constants'

export const chatRoutes = new OpenAPIHono<AppEnv>()

chatRoutes.use('*', authMiddleware)
// Feature gate disabled for development — remove this line in production
// chatRoutes.use('*', requireFeature(FEATURES.AI_ASSISTANT))

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// POST /
// ---------------------------------------------------------------------------
const chatRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Chat'],
  summary: 'Send a chat message',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: chatMessageSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Chat response' },
    403: { content: { 'application/json': { schema: errorResponse } }, description: 'AI disabled' },
    429: { content: { 'application/json': { schema: errorResponse } }, description: 'Rate limited' },
  },
})

chatRoutes.openapi(chatRoute, async (c) => {
  const userId = c.get('user').userId

  if (!chatService.checkRateLimit(userId)) {
    return c.json({ error: 'Too Many Requests' }, 429)
  }

  const aiAllowed = await chatService.checkAiDataSharing(userId)
  if (!aiAllowed) {
    return c.json(
      { error: 'AI Data Sharing is disabled. Please enable it in Settings to use the chat.' },
      403,
    )
  }

  const body = c.req.valid('json')
  const result = await chatService.chat(userId, body)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// GET /briefing
// ---------------------------------------------------------------------------
const briefingRoute = createRoute({
  method: 'get',
  path: '/briefing',
  tags: ['Chat'],
  summary: 'Get daily briefing',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Briefing' },
  },
})

chatRoutes.openapi(briefingRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await chatService.getBriefing(userId)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// GET /finance-insight
// ---------------------------------------------------------------------------
const financeInsightRoute = createRoute({
  method: 'get',
  path: '/finance-insight',
  tags: ['Chat'],
  summary: 'Get finance insight',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Finance insight' },
  },
})

chatRoutes.openapi(financeInsightRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await chatService.getFinanceInsight(userId)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// POST /weekly-plan
// ---------------------------------------------------------------------------
const weeklyPlanRoute = createRoute({
  method: 'post',
  path: '/weekly-plan',
  tags: ['Chat', 'Planning'],
  summary: 'Generate weekly plan using AI',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: z.object({ weekStartDate: z.string() }) } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Weekly plan' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid request' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

chatRoutes.openapi(weeklyPlanRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { weekStartDate } = c.req.valid('json')

  if (!weekStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) {
    return c.json({ error: 'weekStartDate must be in YYYY-MM-DD format' }, 400)
  }

  try {
    const data = await chatService.weeklyPlanning(userId, weekStartDate)
    return c.json({ data }, 200)
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate weekly plan' }, 500)
  }
}) as any)
