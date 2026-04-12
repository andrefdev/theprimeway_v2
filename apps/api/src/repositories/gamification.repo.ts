import { prisma } from '../lib/prisma'

class GamificationRepository {
  async findProfile(userId: string) {
    return prisma.gamificationProfile.findUnique({ where: { userId } })
  }

  async createProfile(userId: string) {
    return prisma.gamificationProfile.create({ data: { userId } })
  }

  async upsertProfile(userId: string, updateData: Record<string, unknown>, createData?: Record<string, unknown>) {
    return prisma.gamificationProfile.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...createData },
    })
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    return prisma.gamificationProfile.update({ where: { userId }, data })
  }

  async aggregateTodayXp(userId: string, earnedDate: string) {
    return prisma.xpEvent.aggregate({
      where: { userId, earnedDate },
      _sum: { amount: true },
    })
  }

  async createXpEvent(data: {
    userId: string
    source: string
    sourceId: string | null
    amount: number
    earnedDate: string
    metadata: Record<string, unknown>
  }) {
    return prisma.xpEvent.create({ data: data as any })
  }

  async findDailyXpSnapshots(userId: string, dateFrom: string) {
    return prisma.dailyXpSnapshot.findMany({
      where: { userId, date: { gte: dateFrom } },
      orderBy: { date: 'desc' },
    })
  }

  async findXpHistory(
    where: Record<string, unknown>,
    opts: { limit: number; offset: number },
  ) {
    return prisma.xpEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' } as any,
      take: opts.limit,
      skip: opts.offset,
    })
  }

  async countXpHistory(where: Record<string, unknown>) {
    return prisma.xpEvent.count({ where })
  }

  async findAchievements(userId: string) {
    return prisma.achievement.findMany({
      include: { userAchievements: { where: { userId } } },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findDailyChallenges(userId: string, date: string) {
    return prisma.dailyChallenge.findMany({
      where: { userId, date },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findDailyChallengeByIdAndUser(id: string, userId: string) {
    return prisma.dailyChallenge.findFirst({ where: { id, userId } })
  }

  async updateDailyChallenge(id: string, data: Record<string, unknown>) {
    return prisma.dailyChallenge.update({ where: { id }, data })
  }
}

export const gamificationRepo = new GamificationRepository()
