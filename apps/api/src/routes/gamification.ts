/**
 * Gamification Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  updateGamificationSettingsSchema,
  awardXpSchema,
  streakCheckInSchema,
  challengeProgressSchema,
} from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { parsePaginationLimit, parsePaginationOffset } from '../lib/utils'
import { gamificationService } from '../services/gamification.service'
import type { AppEnv } from '../types/env'

export const gamificationRoutes = new OpenAPIHono<AppEnv>()

gamificationRoutes.use('*', authMiddleware)

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------
const getProfileRoute = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['Gamification'],
  summary: 'Get gamification profile',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Profile' },
  },
})

gamificationRoutes.openapi(getProfileRoute, async (c) => {
  const userId = c.get('user').userId
  const todayDate = c.req.query('date') || undefined
  const data = await gamificationService.getProfile(userId, todayDate)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// PATCH /profile/settings
// ---------------------------------------------------------------------------
const updateSettingsRoute = createRoute({
  method: 'patch',
  path: '/profile/settings',
  tags: ['Gamification'],
  summary: 'Update gamification settings',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updateGamificationSettingsSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
  },
})

gamificationRoutes.openapi(updateSettingsRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const data = await gamificationService.updateProfileSettings(userId, body)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// POST /xp
// ---------------------------------------------------------------------------
const awardXpRoute = createRoute({
  method: 'post',
  path: '/xp',
  tags: ['Gamification'],
  summary: 'Award XP',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: awardXpSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'XP awarded' },
  },
})

gamificationRoutes.openapi(awardXpRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const xpEvent = await gamificationService.awardXp(userId, body)
  return c.json({ data: xpEvent }, 200)
})

// ---------------------------------------------------------------------------
// GET /xp/daily
// ---------------------------------------------------------------------------
const dailyXpRoute = createRoute({
  method: 'get',
  path: '/xp/daily',
  tags: ['Gamification'],
  summary: 'Get daily XP snapshots',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'Daily XP' },
  },
})

gamificationRoutes.openapi(dailyXpRoute, async (c) => {
  const userId = c.get('user').userId
  const days = parseInt(c.req.query('days') || '7', 10)
  const { snapshots, count } = await gamificationService.getDailyXp(userId, days)
  return c.json({ data: snapshots, count }, 200)
})

// ---------------------------------------------------------------------------
// GET /xp/history
// ---------------------------------------------------------------------------
const xpHistoryRoute = createRoute({
  method: 'get',
  path: '/xp/history',
  tags: ['Gamification'],
  summary: 'Get XP history',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'XP history' },
  },
})

gamificationRoutes.openapi(xpHistoryRoute, async (c) => {
  const userId = c.get('user').userId
  const q = c.req.query()

  const { events, count } = await gamificationService.getXpHistory(userId, {
    source: q.source || undefined,
    dateFrom: q.dateFrom || q.date_from || undefined,
    dateTo: q.dateTo || q.date_to || undefined,
    limit: q.limit ? parsePaginationLimit(q.limit) : 50,
    offset: q.offset ? parsePaginationOffset(q.offset) : 0,
  })

  return c.json({ data: events, count }, 200)
})

// ---------------------------------------------------------------------------
// GET /streak
// ---------------------------------------------------------------------------
const getStreakRoute = createRoute({
  method: 'get',
  path: '/streak',
  tags: ['Gamification'],
  summary: 'Get streak info',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Streak' },
  },
})

gamificationRoutes.openapi(getStreakRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await gamificationService.getStreak(userId)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// POST /streak
// ---------------------------------------------------------------------------
const checkInStreakRoute = createRoute({
  method: 'post',
  path: '/streak',
  tags: ['Gamification'],
  summary: 'Check in streak',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: streakCheckInSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Checked in' },
  },
})

gamificationRoutes.openapi(checkInStreakRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const data = await gamificationService.checkInStreak(userId, body.date)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// GET /achievements
// ---------------------------------------------------------------------------
const getAchievementsRoute = createRoute({
  method: 'get',
  path: '/achievements',
  tags: ['Gamification'],
  summary: 'Get achievements',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'Achievements' },
  },
})

gamificationRoutes.openapi(getAchievementsRoute, async (c) => {
  const userId = c.get('user').userId
  const locale = c.req.query('locale') || 'en'
  const data = await gamificationService.getAchievements(userId, locale)
  return c.json({ data, count: data.length }, 200)
})

// ---------------------------------------------------------------------------
// POST /achievements
// ---------------------------------------------------------------------------
const checkAchievementsRoute = createRoute({
  method: 'post',
  path: '/achievements',
  tags: ['Gamification'],
  summary: 'Check achievements',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Check result' },
  },
})

gamificationRoutes.openapi(checkAchievementsRoute, async (c) => {
  const userId = c.get('user').userId
  const result = await gamificationService.checkAchievements(userId)
  return c.json(result, 200)
})

// ---------------------------------------------------------------------------
// GET /challenges
// ---------------------------------------------------------------------------
const getChallengesRoute = createRoute({
  method: 'get',
  path: '/challenges',
  tags: ['Gamification'],
  summary: 'Get daily challenges',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'Challenges' },
  },
})

gamificationRoutes.openapi(getChallengesRoute, async (c) => {
  const userId = c.get('user').userId
  const date = c.req.query('date') || new Date().toISOString().split('T')[0]
  const locale = c.req.query('locale') ?? 'en'
  const data = await gamificationService.getChallenges(userId, date as string, locale as string)
  return c.json({ data, count: data.length }, 200)
})

// ---------------------------------------------------------------------------
// POST /challenges/progress
// ---------------------------------------------------------------------------
const challengeProgressRoute = createRoute({
  method: 'post',
  path: '/challenges/progress',
  tags: ['Gamification'],
  summary: 'Update challenge progress',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: challengeProgressSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

gamificationRoutes.openapi(challengeProgressRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const challengeId = body.challengeId || body.challenge_id
  if (!challengeId) return c.json({ error: 'challengeId is required' }, 400)
  const updated = await gamificationService.updateChallengeProgress(userId, challengeId, body.increment)
  if (!updated) return c.json({ error: 'Challenge not found' }, 404)
  return c.json({ data: updated }, 200)
}) as any)

// ---------------------------------------------------------------------------
// POST /seed
// ---------------------------------------------------------------------------
const seedRoute = createRoute({
  method: 'post',
  path: '/seed',
  tags: ['Gamification'],
  summary: 'Seed achievements',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Seeded' },
  },
})

gamificationRoutes.openapi(seedRoute, async (c) => {
  return c.json({ data: { success: true, message: 'Achievements seed endpoint ready' } }, 200)
})
