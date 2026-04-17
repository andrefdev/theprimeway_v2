/**
 * Auth Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries for auth-related operations
 * - User lookup, creation, OAuth account management
 * - Token revocation storage
 * - Uses $transaction for multi-step operations
 * - NO business logic, NO HTTP concerns
 */
import { prisma } from '../lib/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CreateUserData {
  name: string
  email: string
  passwordHash: string
}

export interface OAuthAccountData {
  provider: string
  providerAccountId: string
  accessToken: string
  idToken?: string
}

export interface OAuthUserInfo {
  email: string
  name?: string
  image?: string
  providerAccountId: string
}

const userSelectWithSettings = {
  id: true,
  name: true,
  email: true,
  image: true,
  emailVerified: true,
  passwordHash: true,
  settings: {
    select: { timezone: true, theme: true, locale: true, baseCurrency: true },
  },
} as const

const userSelectPublic = {
  id: true,
  name: true,
  email: true,
  image: true,
  emailVerified: true,
  role: true,
} as const

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { ...userSelectPublic, passwordHash: true },
    })
  }

  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: userSelectWithSettings,
    })
  }

  async findUserByIdMinimal(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })
  }

  async createUserWithSettings(data: CreateUserData) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          emailVerified: new Date(),
        },
        select: userSelectPublic,
      })

      await tx.userSettings.create({
        data: { userId: user.id, timezone: 'UTC', theme: 'dark', locale: 'en' },
      })

      return user
    })
  }

  async findOAuthAccount(provider: string, providerAccountId: string) {
    return prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: { select: userSelectPublic } },
    })
  }

  async updateOAuthTokens(accountId: string, accessToken: string, idToken?: string) {
    return prisma.account.update({
      where: { id: accountId },
      data: { access_token: accessToken, id_token: idToken },
    })
  }

  async linkOAuthAccount(userId: string, account: OAuthAccountData) {
    return prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        access_token: account.accessToken,
        id_token: account.idToken,
      },
    })
  }

  async createOAuthUserWithSettings(userInfo: OAuthUserInfo, account: OAuthAccountData) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          image: userInfo.image,
          emailVerified: new Date(),
          accounts: {
            create: {
              type: 'oauth',
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.accessToken,
              id_token: account.idToken,
            },
          },
        },
        select: userSelectPublic,
      })

      await tx.userSettings.create({
        data: { userId: user.id, timezone: 'UTC', theme: 'dark', locale: 'en' },
      })

      return user
    })
  }

  async revokeToken(tokenHash: string, userId: string, expiresAt: Date) {
    return prisma.revokedToken.create({
      data: { tokenHash, userId, expiresAt },
    })
  }
}

export const authRepository = new AuthRepository()
