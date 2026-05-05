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
import {
  loginSchema,
  registerSchema,
  oauthSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestAccountDeletionSchema,
  confirmAccountDeletionSchema,
} from '@repo/shared/validators'
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

const verificationPendingResponse = z.object({
  requiresVerification: z.literal(true),
  email: z.string(),
})

const okResponse = z.object({ ok: z.literal(true) })

const loginResponse = z.union([tokenResponse, verificationPendingResponse])

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
    200: { content: { 'application/json': { schema: loginResponse } }, description: 'Login successful or verification required' },
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
    201: { content: { 'application/json': { schema: verificationPendingResponse } }, description: 'Registration started — verification code sent' },
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
// POST /verify-email
// ---------------------------------------------------------------------------
const verifyEmailRoute = createRoute({
  method: 'post',
  path: '/verify-email',
  tags: ['Auth'],
  summary: 'Verify registration OTP and finalize signup',
  request: { body: { content: { 'application/json': { schema: verifyEmailSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: tokenResponse } }, description: 'Email verified, session issued' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid or expired code' },
  },
})

authRoutes.openapi(verifyEmailRoute, async (c) => {
  const { email, code } = c.req.valid('json')
  const result = await authService.verifyEmail(email, code)
  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// POST /resend-otp
// ---------------------------------------------------------------------------
const resendOtpRoute = createRoute({
  method: 'post',
  path: '/resend-otp',
  tags: ['Auth'],
  summary: 'Resend a one-time code (register or reset)',
  request: { body: { content: { 'application/json': { schema: resendOtpSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: okResponse } }, description: 'Sent (or silently ignored)' },
    429: { content: { 'application/json': { schema: errorResponse } }, description: 'Rate limit exceeded' },
  },
})

authRoutes.openapi(resendOtpRoute, async (c) => {
  const { email, purpose } = c.req.valid('json')
  const result = await authService.resendOtp(email, purpose)
  if ('error' in result) return c.json({ error: result.error }, 429)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// POST /forgot-password
// ---------------------------------------------------------------------------
const forgotPasswordRoute = createRoute({
  method: 'post',
  path: '/forgot-password',
  tags: ['Auth'],
  summary: 'Request password reset OTP',
  request: { body: { content: { 'application/json': { schema: forgotPasswordSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: okResponse } }, description: 'If the account exists, an email was sent' },
  },
})

authRoutes.openapi(forgotPasswordRoute, async (c) => {
  const { email } = c.req.valid('json')
  const result = await authService.forgotPassword(email)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// POST /reset-password
// ---------------------------------------------------------------------------
const resetPasswordRoute = createRoute({
  method: 'post',
  path: '/reset-password',
  tags: ['Auth'],
  summary: 'Reset password with OTP',
  request: { body: { content: { 'application/json': { schema: resetPasswordSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: okResponse } }, description: 'Password reset' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid or expired code' },
  },
})

authRoutes.openapi(resetPasswordRoute, async (c) => {
  const { email, code, password } = c.req.valid('json')
  const result = await authService.resetPassword(email, code, password)
  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json(result, 200)
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
// POST /request-account-deletion (auth required)
// ---------------------------------------------------------------------------
const requestAccountDeletionRoute = createRoute({
  method: 'post',
  path: '/request-account-deletion',
  tags: ['Auth'],
  summary: 'Request account deletion — sends a confirmation OTP to the user email',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: requestAccountDeletionSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ ok: z.literal(true), hasPassword: z.boolean() }) } }, description: 'Confirmation email sent' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid request' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Unauthorized' },
    429: { content: { 'application/json': { schema: errorResponse } }, description: 'Too many requests' },
  },
})

authRoutes.use('/request-account-deletion', authMiddleware)
authRoutes.openapi(requestAccountDeletionRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { confirmEmail, password, reason } = c.req.valid('json')
  const result = await authService.requestAccountDeletion(userId, confirmEmail, password, reason)
  if ('error' in result) {
    const status = result.error.includes('Too many') ? 429 : 400
    return c.json({ error: result.error }, status)
  }
  return c.json(result, 200)
}) as any)

// ---------------------------------------------------------------------------
// POST /confirm-account-deletion (auth required)
// ---------------------------------------------------------------------------
const confirmAccountDeletionRoute = createRoute({
  method: 'post',
  path: '/confirm-account-deletion',
  tags: ['Auth'],
  summary: 'Confirm account deletion with OTP — permanently deletes the user',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: confirmAccountDeletionSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: okResponse } }, description: 'Account deleted' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid or expired code' },
    401: { content: { 'application/json': { schema: errorResponse } }, description: 'Unauthorized' },
  },
})

authRoutes.use('/confirm-account-deletion', authMiddleware)
authRoutes.openapi(confirmAccountDeletionRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { code } = c.req.valid('json')
  const result = await authService.confirmAccountDeletion(userId, code)
  if ('error' in result) return c.json({ error: result.error }, 400)
  return c.json(result, 200)
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
