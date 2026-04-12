/**
 * Calendar Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { updateCalendarSchema, googleCallbackSchema, syncCalendarSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { calendarService } from '../services/calendar.service'
import type { AppEnv } from '../types/env'

export const calendarRoutes = new OpenAPIHono<AppEnv>()

calendarRoutes.use('*', authMiddleware)

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// GET /accounts
// ---------------------------------------------------------------------------
const listAccountsRoute = createRoute({
  method: 'get',
  path: '/accounts',
  tags: ['Calendar'],
  summary: 'List calendar accounts',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } }, description: 'Calendar accounts' },
  },
})

calendarRoutes.openapi(listAccountsRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const accounts = await calendarService.listAccounts(userId)
  return c.json({ data: accounts }, 200)
}) as any)

// ---------------------------------------------------------------------------
// DELETE /accounts
// ---------------------------------------------------------------------------
const deleteAccountRoute = createRoute({
  method: 'delete',
  path: '/accounts',
  tags: ['Calendar'],
  summary: 'Delete a calendar account',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'Deleted' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Missing id' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

calendarRoutes.openapi(deleteAccountRoute, async (c) => {
  const userId = c.get('user').userId
  const id = c.req.query('id')

  if (!id) return c.json({ error: 'Missing id parameter' }, 400)

  const result = await calendarService.deleteAccount(userId, id)
  if (!result) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true }, 200)
})

// ---------------------------------------------------------------------------
// PATCH /calendars/:id
// ---------------------------------------------------------------------------
const updateCalendarRoute = createRoute({
  method: 'patch',
  path: '/calendars/:id',
  tags: ['Calendar'],
  summary: 'Update a calendar',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updateCalendarSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

calendarRoutes.openapi(updateCalendarRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const result = await calendarService.updateCalendar(userId, id, body)

  if ('error' in result) {
    if (result.error === 'not_found') return c.json({ error: 'Not found' }, 404)
    if (result.error === 'unauthorized') return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ data: (result as any).data }, 200)
}) as any)

// ---------------------------------------------------------------------------
// GET /google/connect
// ---------------------------------------------------------------------------
const googleConnectRoute = createRoute({
  method: 'get',
  path: '/google/connect',
  tags: ['Calendar'],
  summary: 'Get Google OAuth URL',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ url: z.string() }) } }, description: 'OAuth URL' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Not configured' },
  },
})

calendarRoutes.openapi(googleConnectRoute, async (c) => {
  const url = calendarService.getGoogleOAuthUrl()
  if (!url) return c.json({ error: 'Google Calendar not configured' }, 500)
  return c.json({ url }, 200)
})

// ---------------------------------------------------------------------------
// POST /google/callback
// ---------------------------------------------------------------------------
const googleCallbackRoute = createRoute({
  method: 'post',
  path: '/google/callback',
  tags: ['Calendar'],
  summary: 'Handle Google OAuth callback',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: googleCallbackSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Connected' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid code' },
  },
})

calendarRoutes.openapi(googleCallbackRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { code } = c.req.valid('json')

  const result = await calendarService.handleGoogleCallback(userId, code)

  if ('error' in result) {
    if (result.error === 'not_configured') return c.json({ error: 'Google Calendar not configured' }, 500)
    if (result.error === 'token_exchange_failed') return c.json({ error: 'Token exchange failed' }, 400)
  }

  return c.json({ data: (result as any).data }, 200)
}) as any)

// ---------------------------------------------------------------------------
// GET /google/events
// ---------------------------------------------------------------------------
const googleEventsRoute = createRoute({
  method: 'get',
  path: '/google/events',
  tags: ['Calendar'],
  summary: 'Get Google Calendar events',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } }, description: 'Events' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Missing params' },
  },
})

calendarRoutes.openapi(googleEventsRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const timeMin = c.req.query('timeMin')
  const timeMax = c.req.query('timeMax')

  if (!timeMin || !timeMax) return c.json({ error: 'Missing timeMin or timeMax' }, 400)

  const allEvents = await calendarService.getGoogleEvents(userId, timeMin, timeMax)
  return c.json({ data: allEvents }, 200)
}) as any)

// ---------------------------------------------------------------------------
// POST /google/import
// ---------------------------------------------------------------------------
const googleImportRoute = createRoute({
  method: 'post',
  path: '/google/import',
  tags: ['Calendar'],
  summary: 'Import Google Calendar',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Imported' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'No account found' },
  },
})

calendarRoutes.openapi(googleImportRoute, async (c) => {
  const userId = c.get('user').userId
  const account = await calendarService.importGoogleCalendar(userId)
  if (!account) return c.json({ error: 'No Google Auth account found with refresh token' }, 404)
  return c.json({ data: account }, 200)
})

// ---------------------------------------------------------------------------
// POST /sync
// ---------------------------------------------------------------------------
const syncRoute = createRoute({
  method: 'post',
  path: '/sync',
  tags: ['Calendar'],
  summary: 'Sync calendars',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: syncCalendarSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Sync result' },
  },
})

calendarRoutes.openapi(syncRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const calendarId = body.calendarId || body.calendar_id
  const result = await calendarService.syncCalendars(userId, calendarId)
  return c.json(result, 200)
})
