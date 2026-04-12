/**
 * Subscription Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { subscriptionActionSchema, checkoutSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { subscriptionsService } from '../services/subscriptions.service'

export const subscriptionRoutes = new OpenAPIHono<AppEnv>()

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// GET /plans — public, no auth
// ---------------------------------------------------------------------------
const plansRoute = createRoute({
  method: 'get',
  path: '/plans',
  tags: ['Subscriptions'],
  summary: 'Get available subscription plans',
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } }, description: 'Plans' },
  },
})

subscriptionRoutes.openapi(plansRoute, (async (c: any) => {
  const plans = await subscriptionsService.getPlans()
  return c.json({ data: plans }, 200)
}) as any)

// Auth-protected routes
const protectedRoutes = new OpenAPIHono<AppEnv>()
protectedRoutes.use('*', authMiddleware)

// ---------------------------------------------------------------------------
// GET /status
// ---------------------------------------------------------------------------
const statusRoute = createRoute({
  method: 'get',
  path: '/status',
  tags: ['Subscriptions'],
  summary: 'Get subscription status',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Status' },
  },
})

protectedRoutes.openapi(statusRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await subscriptionsService.getStatus(userId)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// POST /status
// ---------------------------------------------------------------------------
const actionRoute = createRoute({
  method: 'post',
  path: '/status',
  tags: ['Subscriptions'],
  summary: 'Perform subscription action',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: subscriptionActionSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Action result' },
    409: { content: { 'application/json': { schema: errorResponse } }, description: 'Conflict' },
  },
})

protectedRoutes.openapi(actionRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { action } = c.req.valid('json')

  if (action === 'start_trial') {
    const result = await subscriptionsService.startTrial(userId)
    if ('error' in result) {
      return c.json({ error: 'User already has a subscription or trial' }, 409)
    }
    return c.json({ data: result.data }, 200)
  }

  return c.json({ error: 'Invalid action' }, 400)
}) as any)

// ---------------------------------------------------------------------------
// POST /checkout
// ---------------------------------------------------------------------------
const checkoutRoute = createRoute({
  method: 'post',
  path: '/checkout',
  tags: ['Subscriptions'],
  summary: 'Create checkout session',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: checkoutSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ url: z.string() }) } }, description: 'Checkout URL' },
    502: { content: { 'application/json': { schema: errorResponse } }, description: 'Checkout failed' },
  },
})

protectedRoutes.openapi(checkoutRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const userEmail = c.get('user').email
  const { variantId } = c.req.valid('json')

  const result = await subscriptionsService.createCheckout(userId, userEmail, variantId)

  if ('error' in result) {
    if (result.error === 'not_configured') return c.json({ error: 'Lemon Squeezy not configured' }, 500)
    if (result.error === 'checkout_failed') return c.json({ error: 'Failed to create checkout' }, 502)
  }

  return c.json({ url: (result as any).url }, 200)
}) as any)

// Mount protected routes
subscriptionRoutes.route('/', protectedRoutes)

// ---------------------------------------------------------------------------
// POST /webhook — NO auth middleware
// ---------------------------------------------------------------------------
const webhookRoute = createRoute({
  method: 'post',
  path: '/webhook',
  tags: ['Subscriptions'],
  summary: 'Handle payment webhook',
  responses: {
    200: { description: 'OK' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid signature' },
  },
})

subscriptionRoutes.openapi(webhookRoute, async (c) => {
  const rawBody = await c.req.text()
  const signature = c.req.header('x-signature') || ''

  const result = await subscriptionsService.handleWebhook(rawBody, signature)

  if ('error' in result && result.error === 'invalid_signature') {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  return c.text('OK', 200)
})
