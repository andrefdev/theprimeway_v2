import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { apiKeysService } from '../services/api-keys.service'

export const apiKeysRoutes = new OpenAPIHono()

apiKeysRoutes.use('*', authMiddleware)

apiKeysRoutes.get('/', async (c) => {
  const { userId } = (c as any).get('user')
  const data = await apiKeysService.list(userId)
  return c.json({ data })
})

apiKeysRoutes.post('/', async (c) => {
  const { userId } = (c as any).get('user')
  const body = await c.req.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'API key'
  const result = await apiKeysService.create(userId, name)
  return c.json({ data: result }, 201)
})

apiKeysRoutes.delete('/:id', async (c) => {
  const { userId } = (c as any).get('user')
  const id = c.req.param('id')
  const ok = await apiKeysService.revoke(userId, id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
