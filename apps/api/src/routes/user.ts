/**
 * User Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request (query params, body, path params)
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { userService } from '../services/user.service'

export const userRoutes = new OpenAPIHono<AppEnv>()

// Apply auth middleware to all routes
userRoutes.use('*', authMiddleware)

// ---------------------------------------------------------------------------
// Shared response schemas
// ---------------------------------------------------------------------------
const errorResponse = z.object({ error: z.string() })
const messageResponse = z.object({ message: z.string() })

// ---------------------------------------------------------------------------
// GET /settings — Fetch user settings
// ---------------------------------------------------------------------------
const settingsResponseSchema = z.object({
  data: z.object({
    userId: z.string(),
    locale: z.string(),
    theme: z.string(),
    timezone: z.string(),
  }).passthrough(),
})

const getSettingsRoute = createRoute({
  method: 'get',
  path: '/settings',
  tags: ['User'],
  summary: 'Get user settings',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: settingsResponseSchema } }, description: 'User settings' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(getSettingsRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const data = await userService.getSettings(userId)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[USER_SETTINGS_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// PUT /settings — Update user settings
// ---------------------------------------------------------------------------
const updateSettingsBody = z.object({
  locale: z.enum(['en', 'es', 'pt', 'fr']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().optional(),
})

const putSettingsRoute = createRoute({
  method: 'put',
  path: '/settings',
  tags: ['User'],
  summary: 'Update user settings',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: updateSettingsBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: settingsResponseSchema } }, description: 'Updated settings' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(putSettingsRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const body = c.req.valid('json')
    const data = await userService.updateSettings(userId, body)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[USER_SETTINGS_PUT]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /profile — Fetch user profile
// ---------------------------------------------------------------------------
const profileDataSchema = z.object({
  data: z.object({
    userId: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    displayName: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    primaryGoal: z.string().nullable().optional(),
  }).passthrough(),
})

const getProfileRoute = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['User'],
  summary: 'Get user profile',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: profileDataSchema } }, description: 'User profile' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(getProfileRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const profile = await userService.getProfile(userId)
    if (!profile) return c.json({ error: 'Not Found' }, 404)
    return c.json({ data: profile }, 200)
  } catch (error) {
    console.error('[PROFILE_GET]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// PATCH /profile — Update user profile
// ---------------------------------------------------------------------------
const updateProfileBody = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  profilePicture: z.string().optional(),
  bio: z.string().optional(),
  primaryGoal: z.string().optional(),
})

const patchProfileRoute = createRoute({
  method: 'patch',
  path: '/profile',
  tags: ['User'],
  summary: 'Update user profile',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: updateProfileBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: profileDataSchema } }, description: 'Updated profile' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid request' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(patchProfileRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const body = c.req.valid('json')
    const data = await userService.upsertProfile(userId, body)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[PROFILE_PATCH]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// ---------------------------------------------------------------------------
// POST /profile — Alias for PATCH (upsert convenience)
// ---------------------------------------------------------------------------
const postProfileRoute = createRoute({
  method: 'post',
  path: '/profile',
  tags: ['User'],
  summary: 'Create or update user profile',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: updateProfileBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: profileDataSchema } }, description: 'Upserted profile' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid request' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(postProfileRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const body = c.req.valid('json')
    const data = await userService.upsertProfile(userId, body)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[PROFILE_POST]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)

// /work-preferences endpoints removed — replaced by /api/working-hours.

// ---------------------------------------------------------------------------
// POST /onboarding/complete — Finalize onboarding + seed defaults
// ---------------------------------------------------------------------------
const completeOnboardingBody = z.object({
  locale: z.string().optional(),
  timezone: z.string().optional(),
})

const completeOnboardingRoute = createRoute({
  method: 'post',
  path: '/onboarding/complete',
  tags: ['User'],
  summary: 'Complete onboarding and seed default contexts/channels/working-hours',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: completeOnboardingBody } } },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              settings: z.any(),
              seeded: z.object({ workingHours: z.number() }),
            }),
          }),
        },
      },
      description: 'Onboarding completed',
    },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(completeOnboardingRoute, (async (c: any) => {
  const { userId } = c.get('user')
  try {
    const body = c.req.valid('json')
    const data = await userService.completeOnboarding(userId, body)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[ONBOARDING_COMPLETE]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
}) as any)


// ---------------------------------------------------------------------------
// DELETE /delete — Delete user account (cascading)
// ---------------------------------------------------------------------------
const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/delete',
  tags: ['User'],
  summary: 'Delete user account and all associated data',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }, description: 'User deleted' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Internal error' },
  },
})

userRoutes.openapi(deleteUserRoute, async (c) => {
  const { userId } = c.get('user')

  try {
    await userService.deleteUser(userId)
    return c.json({ success: true }, 200)
  } catch (error) {
    console.error('[USER_DELETE]', error)
    return c.json({ error: 'Internal Error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /section-customizations — List all section customizations
// ---------------------------------------------------------------------------
const getSectionCustomizationsRoute = createRoute({
  method: 'get',
  path: '/section-customizations',
  tags: ['User'],
  summary: 'Get all section customizations',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } }, description: 'Customizations list' },
  },
})

userRoutes.openapi(getSectionCustomizationsRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const data = await userService.listSectionCustomizations(userId)
  return c.json({ data }, 200)
}) as any)

// ---------------------------------------------------------------------------
// PUT /section-customizations — Upsert a section customization
// ---------------------------------------------------------------------------
const upsertSectionCustomizationRoute = createRoute({
  method: 'put',
  path: '/section-customizations',
  tags: ['User'],
  summary: 'Create or update a section customization',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            sectionId: z.string(),
            coverImageUrl: z.string().nullable().optional(),
            coverImageType: z.string().optional(),
            coverPositionY: z.number().optional(),
            iconType: z.string().optional(),
            iconValue: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Customization saved' },
  },
})

userRoutes.openapi(upsertSectionCustomizationRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')
  const { sectionId, ...fields } = body
  const data = await userService.upsertSectionCustomization(userId, sectionId, fields)
  return c.json({ data }, 200)
}) as any)

// ---------------------------------------------------------------------------
// DELETE /section-customizations — Remove a section customization
// ---------------------------------------------------------------------------
const deleteSectionCustomizationRoute = createRoute({
  method: 'delete',
  path: '/section-customizations',
  tags: ['User'],
  summary: 'Delete a section customization',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: messageResponse } }, description: 'Customization deleted' },
  },
})

userRoutes.openapi(deleteSectionCustomizationRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const sectionId = c.req.query('sectionId')
  if (!sectionId) return c.json({ error: 'sectionId is required' }, 400)

  await userService.deleteSectionCustomization(userId, sectionId)
  return c.json({ message: 'Deleted' }, 200)
}) as any)
