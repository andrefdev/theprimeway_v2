/**
 * Auth Service — Business logic layer
 *
 * Responsibilities:
 * - Credential validation, password hashing
 * - Token generation and verification
 * - OAuth provider user info resolution
 * - Orchestrate auth repository calls
 * - NO Prisma queries, NO HTTP concerns
 */
import { authRepository } from '../repositories/auth.repo'
import { signAccessToken, signRefreshToken } from '../middleware/auth'
import bcrypt from 'bcryptjs'
import * as jose from 'jose'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AuthTokens {
  token: string
  refreshToken: string
}

export interface AuthResult {
  token: string
  refreshToken: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    emailVerified: string | null
    role: string
  }
}

interface OAuthUserInfo {
  email: string
  name?: string
  image?: string
  providerAccountId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')
const SALT_ROUNDS = 12

function formatUser(user: { id: string; name: string | null; email: string | null; image: string | null; emailVerified: Date | null; role?: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email!,
    image: user.image,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    role: user.role ?? 'user',
  }
}

async function generateTokens(userId: string, email: string): Promise<AuthTokens> {
  const [token, refreshToken] = await Promise.all([
    signAccessToken(userId, email),
    signRefreshToken(userId, email),
  ])
  return { token, refreshToken }
}

async function getGoogleUserInfo(token: string): Promise<OAuthUserInfo | null> {
  // Try as ID token (JWT) first
  if (token.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString())
      if (payload.email && payload.sub) {
        return { email: payload.email, name: payload.name, image: payload.picture, providerAccountId: payload.sub }
      }
    } catch { /* Not a valid JWT, fallback */ }
  }
  // Fallback: access token
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json() as { email: string; name: string; picture: string; id: string }
  return { email: data.email, name: data.name, image: data.picture, providerAccountId: data.id }
}

async function getAppleUserInfo(idToken: string): Promise<OAuthUserInfo | null> {
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString())
  return { email: payload.email, name: undefined, image: undefined, providerAccountId: payload.sub }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class AuthService {
  async login(email: string, password: string): Promise<{ error: string } | AuthResult> {
    const normalizedEmail = email.toLowerCase().trim()
    const user = await authRepository.findUserByEmail(normalizedEmail)

    if (!user?.passwordHash) return { error: 'Invalid credentials' }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { error: 'Invalid credentials' }

    const tokens = await generateTokens(user.id, user.email!)
    return { ...tokens, user: formatUser(user) }
  }

  async register(name: string, email: string, password: string): Promise<{ error: string } | AuthResult> {
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await authRepository.findUserByEmail(normalizedEmail)
    if (existing) return { error: 'Email already registered' }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await authRepository.createUserWithSettings({ name, email: normalizedEmail, passwordHash })

    const tokens = await generateTokens(user.id, user.email!)
    return { ...tokens, user: formatUser(user) }
  }

  async refreshToken(refreshTokenStr: string): Promise<{ error: string } | AuthTokens> {
    try {
      const { payload } = await jose.jwtVerify(refreshTokenStr, JWT_SECRET(), {
        issuer: 'theprimeway',
        audience: 'theprimeway',
      })

      if (payload.type !== 'refresh') return { error: 'Invalid token type' }

      const user = await authRepository.findUserByIdMinimal(payload.userId as string)
      if (!user?.email) return { error: 'User not found' }

      return generateTokens(user.id, user.email)
    } catch {
      return { error: 'Invalid or expired refresh token' }
    }
  }

  async logout(authHeader: string): Promise<{ error: string } | { success: true }> {
    if (!authHeader.startsWith('Bearer ')) return { error: 'Missing token' }

    const token = authHeader.slice(7)

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET(), {
        issuer: 'theprimeway',
        audience: 'theprimeway',
      })

      const crypto = await import('node:crypto')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      await authRepository.revokeToken(
        tokenHash,
        payload.userId as string,
        new Date((payload.exp || 0) * 1000),
      )

      return { success: true }
    } catch {
      return { error: 'Invalid token' }
    }
  }

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId)
    if (!user) return null

    return {
      ...user,
      emailVerified: user.emailVerified?.toISOString() ?? null,
    }
  }

  async oauthLogin(provider: string, accessToken: string, idToken?: string): Promise<{ error: string } | AuthResult> {
    let userInfo: OAuthUserInfo | null = null

    if (provider === 'google') {
      userInfo = await getGoogleUserInfo(accessToken)
    } else if (provider === 'apple') {
      if (!idToken) return { error: 'Apple login requires idToken' }
      userInfo = await getAppleUserInfo(idToken)
    }

    if (!userInfo?.email) return { error: 'Failed to get user info from provider' }

    // Check existing OAuth account
    const existingAccount = await authRepository.findOAuthAccount(provider, userInfo.providerAccountId)
    const accountData = { provider, providerAccountId: userInfo.providerAccountId, accessToken, idToken }

    let user

    if (existingAccount) {
      await authRepository.updateOAuthTokens(existingAccount.id, accessToken, idToken)
      user = existingAccount.user
    } else {
      const existingUser = await authRepository.findUserByEmail(userInfo.email)

      if (existingUser) {
        await authRepository.linkOAuthAccount(existingUser.id, accountData)
        user = existingUser
      } else {
        user = await authRepository.createOAuthUserWithSettings(userInfo, accountData)
      }
    }

    const tokens = await generateTokens(user.id, user.email!)
    return { ...tokens, user: formatUser(user) }
  }
}

export const authService = new AuthService()
