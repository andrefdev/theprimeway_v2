import { createMiddleware } from 'hono/factory'
import { apiKeysService } from '../services/api-keys.service'
import { isApiKey } from '../lib/api-key'
import { authMiddleware, type AuthUser } from './auth'

/**
 * Auth middleware that accepts EITHER a JWT access token (Bearer <jwt>)
 * OR a public API key (X-API-Key: pk_live_... / Authorization: Bearer pk_live_...).
 *
 * Use for public-API surfaces that power integrations (Zapier, custom scripts).
 */
export const apiKeyOrJwtMiddleware = createMiddleware<{
  Variables: { user: AuthUser }
}>(async (c, next) => {
  const headerKey = c.req.header('X-API-Key') || c.req.header('x-api-key')
  const authHeader = c.req.header('Authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const candidateKey = headerKey || (bearer && isApiKey(bearer) ? bearer : null)

  if (candidateKey) {
    const userId = await apiKeysService.verifyKey(candidateKey)
    if (!userId) return c.json({ error: 'Invalid API key' }, 401)
    c.set('user', { userId, email: '' })
    await next()
    return
  }

  // Fall through to JWT auth.
  return authMiddleware(c, next)
})
