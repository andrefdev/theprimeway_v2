import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { webhooksService } from '../services/webhooks.service'

export const webhooksRoutes = new OpenAPIHono()

webhooksRoutes.use('*', authMiddleware)

webhooksRoutes.get('/events', (c) => {
  return c.json({ data: webhooksService.allowedEvents() })
})

webhooksRoutes.get('/', async (c) => {
  const { userId } = (c as any).get('user')
  const data = await webhooksService.list(userId)
  return c.json({ data })
})

webhooksRoutes.post('/', async (c) => {
  const { userId } = (c as any).get('user')
  const body = await c.req.json().catch(() => ({}))
  if (typeof body.url !== 'string' || !body.url.startsWith('http')) {
    return c.json({ error: 'Invalid url' }, 400)
  }
  if (!Array.isArray(body.events)) {
    return c.json({ error: 'events must be an array' }, 400)
  }
  const result = await webhooksService.create(userId, {
    url: body.url,
    events: body.events,
    isActive: body.isActive,
  })
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json({ data: result.webhook }, 201)
})

webhooksRoutes.patch('/:id', async (c) => {
  const { userId } = (c as any).get('user')
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const result = await webhooksService.update(userId, id, body)
  if (!result.ok) return c.json({ error: result.reason }, 404)
  return c.json({ data: result.webhook })
})

webhooksRoutes.delete('/:id', async (c) => {
  const { userId } = (c as any).get('user')
  const id = c.req.param('id')
  const ok = await webhooksService.delete(userId, id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
