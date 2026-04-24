import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { requireFeature } from '../middleware/feature-gate'
import { FEATURES } from '@repo/shared/constants'
import { brainService } from '../services/brain.service'

export const brainRoutes = new OpenAPIHono()

brainRoutes.use('*', authMiddleware)
brainRoutes.use('*', requireFeature(FEATURES.BRAIN_MODULE))

// GET /api/brain/entries
brainRoutes.get('/entries', async (c) => {
  const userId = (c as any).get('user').userId
  const status = c.req.query('status') ?? undefined
  const search = c.req.query('search') ?? undefined
  const limitRaw = c.req.query('limit')
  const offsetRaw = c.req.query('offset')
  const data = await brainService.list(userId, {
    status,
    search,
    limit: limitRaw ? Math.max(1, Math.min(100, Number(limitRaw))) : undefined,
    offset: offsetRaw ? Math.max(0, Number(offsetRaw)) : undefined,
  })
  return c.json({ data })
})

// GET /api/brain/entries/:id
brainRoutes.get('/entries/:id', async (c) => {
  const userId = (c as any).get('user').userId
  const result = await brainService.get(userId, c.req.param('id'))
  if (!result.ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: result.entry })
})

// POST /api/brain/entries
brainRoutes.post('/entries', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  if (typeof body.content !== 'string' || !body.content.trim()) {
    return c.json({ error: 'content is required' }, 400)
  }
  const entry = await brainService.create(userId, body.content.trim())
  return c.json({ data: entry }, 201)
})

// PUT /api/brain/entries/:id (user edits: title, topics, pin, archive)
brainRoutes.put('/entries/:id', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const patch: { userTitle?: string; topics?: string[]; isPinned?: boolean; isArchived?: boolean } = {}
  if (typeof body.userTitle === 'string') patch.userTitle = body.userTitle
  if (Array.isArray(body.topics)) patch.topics = body.topics.filter((t: unknown) => typeof t === 'string')
  if (typeof body.isPinned === 'boolean') patch.isPinned = body.isPinned
  if (typeof body.isArchived === 'boolean') patch.isArchived = body.isArchived
  const result = await brainService.userUpdate(userId, c.req.param('id'), patch)
  if (!result.ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: result.entry })
})

// DELETE /api/brain/entries/:id
brainRoutes.delete('/entries/:id', async (c) => {
  const userId = (c as any).get('user').userId
  const ok = await brainService.delete(userId, c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

// POST /api/brain/entries/:id/reprocess
brainRoutes.post('/entries/:id/reprocess', async (c) => {
  const userId = (c as any).get('user').userId
  const result = await brainService.reprocess(userId, c.req.param('id'))
  if (!result.ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: result.entry })
})

// POST /api/brain/entries/:entryId/action-items/:index/apply
brainRoutes.post('/entries/:entryId/action-items/:index/apply', async (c) => {
  const userId = (c as any).get('user').userId
  const entryId = c.req.param('entryId')
  const index = Number(c.req.param('index'))
  if (!Number.isInteger(index) || index < 0) return c.json({ error: 'Invalid index' }, 400)
  const result = await brainService.applyActionItem(userId, entryId, index)
  if (!result.ok) {
    if (result.reason === 'already_applied') {
      return c.json({ error: 'Already applied', taskId: result.taskId }, 409)
    }
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json({ data: { task: result.task } }, 201)
})
