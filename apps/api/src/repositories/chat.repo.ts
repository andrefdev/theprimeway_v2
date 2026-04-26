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

  async findTopTasksForBriefing(userId: string, today: Date, limit: number) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Prefer tasks scheduled for today, then high-priority, then overdue dueDate
    const [scheduled, others] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          status: 'open',
          kind: 'TASK',
          archivedAt: null,
          OR: [
            { scheduledDate: { gte: today, lt: tomorrow } },
            { day: { gte: today, lt: tomorrow } },
          ],
        },
        orderBy: [{ scheduledStart: 'asc' }, { positionInDay: 'asc' }],
        take: limit,
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: 'open',
          kind: 'TASK',
          archivedAt: null,
          NOT: {
            OR: [
              { scheduledDate: { gte: today, lt: tomorrow } },
              { day: { gte: today, lt: tomorrow } },
            ],
          },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        take: limit,
      }),
    ])
    const seen = new Set<string>()
    const merged: typeof scheduled = []
    for (const t of [...scheduled, ...others]) {
      if (seen.has(t.id)) continue
      seen.add(t.id)
      merged.push(t)
      if (merged.length >= limit) break
    }
    return merged
  }

  async findActiveWeekGoal(userId: string, today: Date) {
    return prisma.goal.findFirst({
      where: {
        userId,
        horizon: 'WEEK',
        status: 'ACTIVE',
        OR: [
          { startsOn: null },
          { startsOn: { lte: today } },
        ],
        AND: [
          {
            OR: [
              { endsOn: null },
              { endsOn: { gte: today } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findCurrentGamificationStreak(userId: string) {
    const profile = await prisma.gamificationProfile.findUnique({
      where: { userId },
      select: { currentStreak: true },
    })
    return profile?.currentStreak ?? 0
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

  async findActiveGoalsByUser(userId: string) {
    return prisma.goal.findMany({
      where: { userId, horizon: 'QUARTER', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const chatRepo = new ChatRepository()
