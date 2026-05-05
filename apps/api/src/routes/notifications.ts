/**
 * Notification Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { registerDeviceSchema, updatePreferencesSchema, sendPushSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { notificationsService } from '../services/notifications.service'

export const notificationRoutes = new OpenAPIHono<AppEnv>()

const errorResponse = z.object({ error: z.string() })

// Apply auth middleware to user-facing routes
notificationRoutes.use('/register', authMiddleware)
notificationRoutes.use('/preferences', authMiddleware)
notificationRoutes.use('/aggregated', authMiddleware)
notificationRoutes.use('/batched', authMiddleware)
notificationRoutes.use('/smart-reminders', authMiddleware)
notificationRoutes.use('/inbox', authMiddleware)
notificationRoutes.use('/inbox/*', authMiddleware)
notificationRoutes.use('/:id/read', authMiddleware)
notificationRoutes.use('/:id/dismiss', authMiddleware)
notificationRoutes.use('/:id', authMiddleware)

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Notifications'],
  summary: 'Register a device for push notifications',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: registerDeviceSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean(), deviceId: z.string() }) } }, description: 'Registered' },
  },
})

notificationRoutes.openapi(registerRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const result = await notificationsService.registerDevice(userId, body)

  if ('error' in result) {
    if (result.error === 'missing_fields') return c.json({ error: 'Missing token or device_type' }, 400)
    if (result.error === 'invalid_device_type') return c.json({ error: 'Invalid device_type' }, 400)
  }

  return c.json({ success: true, deviceId: (result as any).data.id }, 200)
}) as any)

// ---------------------------------------------------------------------------
// DELETE /register
// ---------------------------------------------------------------------------
const unregisterRoute = createRoute({
  method: 'delete',
  path: '/register',
  tags: ['Notifications'],
  summary: 'Unregister a device',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'Unregistered' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Missing token' },
  },
})

notificationRoutes.openapi(unregisterRoute, async (c) => {
  const userId = c.get('user').userId
  const token = c.req.query('token')

  if (!token) return c.json({ error: 'Token is required' }, 400)

  await notificationsService.unregisterDevice(userId, token)
  return c.json({ success: true }, 200)
})

// ---------------------------------------------------------------------------
// GET /preferences
// ---------------------------------------------------------------------------
const getPrefsRoute = createRoute({
  method: 'get',
  path: '/preferences',
  tags: ['Notifications'],
  summary: 'Get notification preferences',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Preferences' },
  },
})

notificationRoutes.openapi(getPrefsRoute, async (c) => {
  const userId = c.get('user').userId
  const preferences = await notificationsService.getPreferences(userId)
  return c.json({ data: preferences }, 200)
})

// ---------------------------------------------------------------------------
// PATCH /preferences
// ---------------------------------------------------------------------------
const updatePrefsRoute = createRoute({
  method: 'patch',
  path: '/preferences',
  tags: ['Notifications'],
  summary: 'Update notification preferences',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updatePreferencesSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
  },
})

notificationRoutes.openapi(updatePrefsRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const preferences = await notificationsService.updatePreferences(userId, body)
  return c.json({ data: preferences }, 200)
})

// ---------------------------------------------------------------------------
// GET /batched
// ---------------------------------------------------------------------------
const batchedRoute = createRoute({
  method: 'get',
  path: '/batched',
  tags: ['Notifications'],
  summary: 'Get batched/grouped notifications',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.any() }) } },
      description: 'Batched notifications',
    },
  },
})

notificationRoutes.openapi(batchedRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await notificationsService.getBatchedNotifications(userId)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// GET /aggregated
// ---------------------------------------------------------------------------
const aggregatedRoute = createRoute({
  method: 'get',
  path: '/aggregated',
  tags: ['Notifications'],
  summary: 'Get aggregated notifications',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'Notifications' },
  },
})

notificationRoutes.openapi(aggregatedRoute, async (c) => {
  const userId = c.get('user').userId
  const notifications = await notificationsService.getAggregated(userId)
  return c.json({ data: notifications, count: notifications.length }, 200)
})

// ---------------------------------------------------------------------------
// GET /smart-reminders
// ---------------------------------------------------------------------------
const smartReminderSchema = z.object({
  habitId: z.string(),
  habitName: z.string(),
  urgency: z.enum(['high', 'medium', 'low']),
  message: z.string(),
  streakAtRisk: z.boolean(),
  calendarBusy: z.boolean(),
})

const smartRemindersRoute = createRoute({
  method: 'get',
  path: '/smart-reminders',
  tags: ['Notifications'],
  summary: 'Get smart habit reminders based on streaks and calendar density',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ data: z.array(smartReminderSchema) }),
        },
      },
      description: 'Smart reminders',
    },
  },
})

notificationRoutes.openapi(smartRemindersRoute, async (c) => {
  const userId = c.get('user').userId
  const reminders = await notificationsService.generateSmartReminders(userId)
  return c.json({ data: reminders }, 200)
})

// ---------------------------------------------------------------------------
// POST /send — admin API key auth
// ---------------------------------------------------------------------------
const sendRoute = createRoute({
  method: 'post',
  path: '/send',
  tags: ['Notifications'],
  summary: 'Send push notification (admin)',
  request: { body: { content: { 'application/json': { schema: sendPushSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Sent' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Unauthorized' },
  },
})

// ---------------------------------------------------------------------------
// GET /inbox — persisted notifications with filters
// ---------------------------------------------------------------------------
const inboxRoute = createRoute({
  method: 'get',
  path: '/inbox',
  tags: ['Notifications'],
  summary: 'Get persisted notification inbox',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      includeRead: z.string().optional(),
      includeDismissed: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ data: z.array(z.any()), count: z.number(), unread: z.number() }),
        },
      },
      description: 'Inbox',
    },
  },
})

notificationRoutes.openapi(inboxRoute, async (c) => {
  const userId = c.get('user').userId
  const q = c.req.valid('query')
  const result = await notificationsService.listInbox(userId, {
    includeRead: q.includeRead === 'true',
    includeDismissed: q.includeDismissed === 'true',
    limit: q.limit ? Math.max(1, Number(q.limit)) : 50,
    offset: q.offset ? Math.max(0, Number(q.offset)) : 0,
  })
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// POST /inbox/mark-all-read
// ---------------------------------------------------------------------------
const markAllReadRoute = createRoute({
  method: 'post',
  path: '/inbox/mark-all-read',
  tags: ['Notifications'],
  summary: 'Mark all notifications as read',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ updated: z.number() }) } }, description: 'OK' },
  },
})

notificationRoutes.openapi(markAllReadRoute, async (c) => {
  const userId = c.get('user').userId
  const result = await notificationsService.markAllRead(userId)
  return c.json({ updated: result.count }, 200)
})

// ---------------------------------------------------------------------------
// POST /inbox/dismiss-all
// ---------------------------------------------------------------------------
const dismissAllRoute = createRoute({
  method: 'post',
  path: '/inbox/dismiss-all',
  tags: ['Notifications'],
  summary: 'Dismiss all active notifications',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ updated: z.number() }) } }, description: 'OK' },
  },
})

notificationRoutes.openapi(dismissAllRoute, async (c) => {
  const userId = c.get('user').userId
  const result = await notificationsService.dismissAll(userId)
  return c.json({ updated: result.count }, 200)
})

// ---------------------------------------------------------------------------
// POST /:id/read
// ---------------------------------------------------------------------------
const markReadRoute = createRoute({
  method: 'post',
  path: '/{id}/read',
  tags: ['Notifications'],
  summary: 'Mark a notification as read',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'OK' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

notificationRoutes.openapi(markReadRoute, async (c) => {
  const userId = c.get('user').userId
  const { id } = c.req.valid('param')
  const result = await notificationsService.markRead(userId, id)
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// POST /:id/dismiss
// ---------------------------------------------------------------------------
const dismissRoute = createRoute({
  method: 'post',
  path: '/{id}/dismiss',
  tags: ['Notifications'],
  summary: 'Dismiss a notification',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'OK' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

notificationRoutes.openapi(dismissRoute, async (c) => {
  const userId = c.get('user').userId
  const { id } = c.req.valid('param')
  const ok = await notificationsService.dismiss(userId, id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ success: true }, 200)
})

// ---------------------------------------------------------------------------
// DELETE /:id
// ---------------------------------------------------------------------------
const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Notifications'],
  summary: 'Delete a notification permanently',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'OK' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

notificationRoutes.openapi(deleteRoute, async (c) => {
  const userId = c.get('user').userId
  const { id } = c.req.valid('param')
  const ok = await notificationsService.deleteNotification(userId, id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ success: true }, 200)
})

notificationRoutes.openapi(sendRoute, (async (c: any) => {
  const apiKey = c.req.header('X-API-Key') || c.req.header('x-api-key')

  if (!process.env.ADMIN_API_KEY) {
    return c.json({ error: 'Server misconfiguration' }, 500)
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = c.req.valid('json')
  const result = await notificationsService.sendPush(body)

  if ('error' in result) {
    return c.json({ error: 'Missing title or body' }, 400)
  }

  return c.json(result, 200)
}) as any)
