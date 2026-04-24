/**
 * User Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries (find, upsert, create, update, delete)
 * - Returns Prisma objects directly (camelCase)
 * - NO business logic, NO HTTP concerns
 */
import { prisma } from '../lib/prisma'

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
class UserRepository {
  // ── Settings ────────────────────────────────────────────────────────────

  async findSettings(userId: string) {
    return prisma.userSettings.findUnique({ where: { userId } })
  }

  async upsertSettings(
    userId: string,
    data: { locale?: string; theme?: string; timezone?: string },
  ) {
    return prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        userId,
        locale: data.locale || 'en',
        theme: data.theme || 'system',
        timezone: data.timezone || 'UTC',
      },
    })
  }

  // ── Profile ─────────────────────────────────────────────────────────────

  async findProfile(userId: string) {
    return prisma.userProfile.findUnique({ where: { userId } })
  }

  async upsertProfile(userId: string, data: Record<string, unknown>) {
    return prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...(data as any),
      },
    })
  }

  // ── Currency Settings ──────────────────────────────────────────────────

  async findCurrencySettings(userId: string) {
    return prisma.userCurrencySettings.findUnique({ where: { userId } })
  }

  async upsertCurrencySettings(
    userId: string,
    data: { baseCurrency?: string; preferredCurrencies?: string[] },
  ) {
    return prisma.userCurrencySettings.upsert({
      where: { userId },
      update: {
        baseCurrency: data.baseCurrency,
        preferredCurrencies: data.preferredCurrencies,
        updatedAt: new Date(),
      },
      create: {
        userId,
        baseCurrency: data.baseCurrency || 'USD',
        preferredCurrencies: data.preferredCurrencies || ['USD', 'PEN'],
      },
    })
  }

  async deleteCurrencySettings(userId: string): Promise<void> {
    await prisma.userCurrencySettings.delete({ where: { userId } })
  }

  // ── User existence check ───────────────────────────────────────────────

  async userExists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return !!user
  }

  // ── Delete User (cascading) ────────────────────────────────────────────

  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } })
  }
}

export const userRepository = new UserRepository()
