import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { ritualsService } from '../services/rituals.service'

export const ritualsRoutes = new OpenAPIHono<AppEnv>()
ritualsRoutes.use('*', authMiddleware)

const kindEnum = z.enum([
  'DAILY_PLAN', 'DAILY_SHUTDOWN', 'WEEKLY_PLAN', 'WEEKLY_REVIEW',
  'QUARTERLY_REVIEW', 'ANNUAL_REVIEW', 'CUSTOM',
])
const cadenceEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND'])
const statusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'])

const ritualCreate = z.object({
  kind: kindEnum,
  name: z.string().min(1).max(200),
  cadence: cadenceEnum,
  scheduledTime: z.string().optional(),
  steps: z.array(z.record(z.any())),
  isEnabled: z.boolean().default(true),
})

const instanceCreate = z.object({
  ritualId: z.string().uuid(),
  scheduledFor: z.coerce.date(),
})
const instancePatch = z.object({
  status: statusEnum.optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  snapshot: z.record(z.any()).optional(),
})
const reflectionCreate = z.object({
  ritualInstanceId: z.string().uuid(),
  promptKey: z.string().min(1).max(100),
  body: z.string().min(1).max(10000),
  attachedGoalId: z.string().uuid().optional(),
})

// ── Templates + ritual CRUD ─────────────────────────────
ritualsRoutes.get('/templates', async (c) => {
  return c.json({ data: await ritualsService.listSystemTemplates() })
})

ritualsRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await ritualsService.listForUser(userId) })
})

ritualsRoutes.post('/', async (c) => {
  const userId = c.get('user').userId
  const body = ritualCreate.parse(await c.req.json())
  return c.json({ data: await ritualsService.create(userId, body) }, 201)
})

ritualsRoutes.patch('/:id', async (c) => {
  const userId = c.get('user').userId
  const body = ritualCreate.partial().parse(await c.req.json())
  const row = await ritualsService.update(userId, c.req.param('id'), body)
  if (!row) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: row })
})

ritualsRoutes.delete('/:id', async (c) => {
  const userId = c.get('user').userId
  const ok = await ritualsService.delete(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not Found' }, 404)
  return c.body(null, 204)
})

// ── Instances ───────────────────────────────────────────
ritualsRoutes.get('/instances', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await ritualsService.listInstances(userId) })
})

ritualsRoutes.post('/instances', async (c) => {
  const userId = c.get('user').userId
  const body = instanceCreate.parse(await c.req.json())
  return c.json({ data: await ritualsService.createInstance(userId, body) }, 201)
})

ritualsRoutes.patch('/instances/:id', async (c) => {
  const userId = c.get('user').userId
  const body = instancePatch.parse(await c.req.json())
  const row = await ritualsService.patchInstance(userId, c.req.param('id'), body)
  if (!row) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: row })
})

// ── Ensure today / week ─────────────────────────────────
ritualsRoutes.get('/today', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await ritualsService.today(userId) })
})

ritualsRoutes.get('/week', async (c) => {
  const userId = c.get('user').userId
  return c.json({ data: await ritualsService.week(userId) })
})

// ── Reflections ─────────────────────────────────────────
ritualsRoutes.post('/reflections', async (c) => {
  const userId = c.get('user').userId
  const body = reflectionCreate.parse(await c.req.json())
  const result = await ritualsService.createReflection(userId, body)
  if (!result.ok) return c.json({ error: 'Instance not found' }, 404)
  return c.json({ data: result.reflection }, 201)
})

// ── Scoped AI ──────────────────────────────────────────
ritualsRoutes.post('/instances/:id/ai-summary', async (c) => {
  const userId = c.get('user').userId
  const result = await ritualsService.aiSummary(userId, c.req.param('id'))
  if (!result.ok) {
    if (result.reason === 'not_found') return c.json({ error: 'Instance not found' }, 404)
    return c.json({ error: result.message ?? 'AI summary failed' }, 500)
  }
  return c.json({ data: result.payload })
})

ritualsRoutes.post('/ai/suggest-weekly-objectives', async (c) => {
  const userId = c.get('user').userId
  const body = (await c.req.json().catch(() => ({}))) as { instanceId?: string }
  const result = await ritualsService.suggestWeeklyObjectives(userId, body.instanceId)
  if (!result.ok) return c.json({ error: result.message ?? 'AI suggestion failed' }, 500)
  return c.json({ data: result.payload })
})
