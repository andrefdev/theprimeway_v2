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
chatRoutes.use('*', requireFeature(FEATURES.AI_ASSISTANT))

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
