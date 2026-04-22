/**
 * Auth Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { loginSchema, registerSchema, oauthSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { authService } from '../services/auth.service'
import type { AppEnv } from '../types/env'

export const authRoutes = new OpenAPIHono<AppEnv>()

// ---------------------------------------------------------------------------
// Shared response schemas
// ---------------------------------------------------------------------------
const tokenResponse = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
    emailVerified: z.string().nullable(),
    role: z.string(),
  }),
})

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'Login with email and password',
  request: { body: { content: { 'application/json': { schema: loginSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: tokenResponse } }, description: 'Login successful' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid credentials' },
  },
})

authRoutes.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid('json')
  const result = await authService.login(email, password)

  if ('error' in result) return c.json({ error: result.error }, 401)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  summary: 'Register a new account',
  request: { body: { content: { 'application/json': { schema: registerSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: tokenResponse } }, description: 'Registration successful' },
    409: { content: { 'application/json': { schema: errorResponse } }, description: 'Email already exists' },
  },
})

authRoutes.openapi(registerRoute, async (c) => {
  const { name, email, password } = c.req.valid('json')
  const result = await authService.register(name, email, password)

  if ('error' in result) return c.json({ error: result.error }, 409)
  return c.json(result, 201)
})

// ---------------------------------------------------------------------------
// POST /refresh
// ---------------------------------------------------------------------------
const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  tags: ['Auth'],
  summary: 'Refresh access token',
  request: {
    body: { content: { 'application/json': { schema: z.object({ refreshToken: z.string().min(1) }) } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ token: z.string(), refreshToken: z.string() }) } }, description: 'Token refreshed' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid refresh token' },
  },
})

authRoutes.openapi(refreshRoute, async (c) => {
  const { refreshToken } = c.req.valid('json')
  const result = await authService.refreshToken(refreshToken)

  if ('error' in result) return c.json({ error: result.error }, 401)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// DELETE /logout
// ---------------------------------------------------------------------------
const logoutRoute = createRoute({
  method: 'delete',
  path: '/logout',
  tags: ['Auth'],
  summary: 'Logout (revoke token)',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'Logged out' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Unauthorized' },
  },
})

authRoutes.openapi(logoutRoute, async (c) => {
  const authHeader = c.req.header('Authorization') || ''
  const result = await authService.logout(authHeader)

  if ('error' in result) return c.json({ error: result.error }, 401)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// GET /me
// ---------------------------------------------------------------------------
const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  summary: 'Get current authenticated user',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            user: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              image: z.string().nullable(),
              emailVerified: z.string().nullable(),
              role: z.string(),
              settings: z.object({
                timezone: z.string().nullable(),
                theme: z.string().nullable(),
                locale: z.string().nullable(),
                baseCurrency: z.string().nullable(),
              }).nullable(),
            }),
          }),
        },
      },
      description: 'Current user',
    },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Unauthorized' },
  },
})

authRoutes.use('/me', authMiddleware)
authRoutes.openapi(meRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const user = await authService.getCurrentUser(userId)

  if (!user) return c.json({ error: 'User not found' }, 401)
  return c.json({ user }, 200)
}) as any)

// ---------------------------------------------------------------------------
// POST /oauth
// ---------------------------------------------------------------------------
const oauthRoute = createRoute({
  method: 'post',
  path: '/oauth',
  tags: ['Auth'],
  summary: 'Login with OAuth provider (Google, Apple)',
  request: { body: { content: { 'application/json': { schema: oauthSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: tokenResponse } }, description: 'OAuth login successful' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to get user info' },
  },
})

authRoutes.openapi(oauthRoute, async (c) => {
  const { provider, accessToken, idToken } = c.req.valid('json')
  const result = await authService.oauthLogin(provider, accessToken, idToken)

  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json(result, 200)
})
