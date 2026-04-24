import { prisma } from '../lib/prisma'

class ChatRepository {
  async findUserSettings(userId: string) {
    return prisma.userSettings.findUnique({
      where: { userId },
      select: { aiDataSharing: true },
    })
  }

  async findOpenTasks(userId: string, limit: number) {
    return prisma.task.findMany({
      where: { userId, status: 'open' },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findActiveHabits(userId: string) {
    const tasks = await prisma.task.findMany({
      where: { userId, kind: 'HABIT', archivedAt: null },
    })
    return tasks.map((t: any) => {
      const m = (t.habitMeta ?? {}) as any
      return {
        id: t.id,
        name: t.title,
        description: t.description,
        targetFrequency: typeof m.targetFrequency === 'number' ? m.targetFrequency : 1,
        frequencyType: m.frequencyType ?? null,
        isActive: true,
      }
    })
  }

  async findHabitLogsByDate(userId: string, gte: Date, lte: Date) {
    return prisma.habitLog.findMany({
      where: { userId, date: { gte, lte } },
    })
  }

  async findPendingTransactions(userId: string, limit: number) {
    return prisma.transaction.findMany({
      where: { userId, status: 'pending' },
      take: limit,
    })
  }

  async findRecentTransactions(userId: string, since: Date, limit: number) {
    return prisma.transaction.findMany({
      where: { userId, date: { gte: since } },
      take: limit,
    })
  }

  async findActiveBudgets(userId: string) {
    return prisma.budget.findMany({
      where: { userId, isActive: true },
    })
  }

  async findActiveSavingsGoals(userId: string) {
    return prisma.savingsGoal.findMany({
      where: { userId, status: 'active' },
    })
  }

  async findActiveGoalsByUser(userId: string) {
    return prisma.goal.findMany({
      where: { userId, horizon: 'QUARTER', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const chatRepo = new ChatRepository()
