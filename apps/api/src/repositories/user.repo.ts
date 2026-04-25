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

  // ── User existence check ───────────────────────────────────────────────

  async userExists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return !!user
  }

  // ── Delete User (cascading) ────────────────────────────────────────────

  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } })
  }

  // ── Section customizations ─────────────────────────────────────────────

  listSectionCustomizations(userId: string) {
    return prisma.sectionCustomization.findMany({ where: { userId } })
  }

  upsertSectionCustomization(
    userId: string,
    sectionId: string,
    fields: Record<string, unknown>,
  ) {
    return prisma.sectionCustomization.upsert({
      where: { userId_sectionId: { userId, sectionId } },
      update: { ...fields, updatedAt: new Date() },
      create: { userId, sectionId, ...fields },
    })
  }

  deleteSectionCustomization(userId: string, sectionId: string) {
    return prisma.sectionCustomization.deleteMany({ where: { userId, sectionId } })
  }
}

export const userRepository = new UserRepository()
