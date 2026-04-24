import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { commandsService } from '../services/commands.service'

export const commandsRoutes = new OpenAPIHono<AppEnv>()
commandsRoutes.use('*', authMiddleware)

commandsRoutes.get('/', async (c) => {
  const userId = c.get('user').userId
  const limit = Number(c.req.query('limit') ?? 50)
  const rows = await commandsService.listRecent(userId, limit)
  return c.json({ data: rows })
})

commandsRoutes.post('/:id/undo', async (c) => {
  const userId = c.get('user').userId
  const result = await commandsService.undo(userId, c.req.param('id'))
  if (!result.ok) {
    if (result.reason === 'not_found') return c.json({ error: 'Command not found' }, 404)
    if (result.reason === 'already_undone') return c.json({ error: 'Already undone' }, 409)
    return c.json({ error: result.message ?? 'Undo failed' }, 400)
  }
  return c.json({ data: { undone: result.undone } })
})
