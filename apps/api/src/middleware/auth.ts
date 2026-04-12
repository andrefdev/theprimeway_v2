import { createMiddleware } from 'hono/factory'
import * as jose from 'jose'

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export interface AuthUser {
  userId: string
  email: string
}

/**
 * JWT Bearer token authentication middleware.
 * Extracts and verifies Bearer token from Authorization header.
 * Sets `user` in context with { userId, email }.
 */
export const authMiddleware = createMiddleware<{
  Variables: { user: AuthUser }
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET(), {
      issuer: 'theprimeway',
      audience: 'theprimeway',
    })

    if (payload.type !== 'access') {
      return c.json({ error: 'Invalid token type' }, 401)
    }

    c.set('user', {
      userId: payload.userId as string,
      email: payload.email as string,
    })

    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})

/** Sign a JWT access token */
export async function signAccessToken(userId: string, email: string): Promise<string> {
  return new jose.SignJWT({ userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('theprimeway')
    .setAudience('theprimeway')
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET())
}

/** Sign a JWT refresh token */
export async function signRefreshToken(userId: string, email: string): Promise<string> {
  return new jose.SignJWT({ userId, email, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('theprimeway')
    .setAudience('theprimeway')
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(JWT_SECRET())
}
