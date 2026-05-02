import { FEATURES, type FeatureKey } from '@repo/shared/constants'
import { startOfLocalDayUtc } from '@repo/shared/utils'
import { prisma } from './prisma'

async function startOfTodayForUser(userId: string): Promise<Date> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { timezone: true },
  })
  return startOfLocalDayUtc(new Date(), settings?.timezone ?? 'UTC')
}

export async function getCurrentUsage(userId: string, featureKey: FeatureKey): Promise<number> {
  switch (featureKey) {
    case FEATURES.HABITS_LIMIT:
      return prisma.task.count({ where: { userId, kind: 'HABIT', archivedAt: null } })
    case FEATURES.TASKS_LIMIT:
      return prisma.task.count({ where: { userId, kind: 'TASK', archivedAt: null } })
    case FEATURES.GOALS_LIMIT:
      return prisma.goal.count({ where: { userId, status: 'ACTIVE' } })
    case FEATURES.BRAIN_ENTRIES_LIMIT:
      return prisma.brainEntry.count({ where: { userId, deletedAt: null } })
    case FEATURES.POMODORO_DAILY_LIMIT:
      return prisma.workingSession.count({
        where: { userId, kind: 'POMODORO', start: { gte: await startOfTodayForUser(userId) } },
      })
    default:
      return 0
  }
}

export async function getAllUsage(userId: string): Promise<Record<string, number>> {
  const keys = [
    FEATURES.HABITS_LIMIT,
    FEATURES.TASKS_LIMIT,
    FEATURES.GOALS_LIMIT,
    FEATURES.BRAIN_ENTRIES_LIMIT,
    FEATURES.POMODORO_DAILY_LIMIT,
  ] as const
  const counts = await Promise.all(keys.map((k) => getCurrentUsage(userId, k)))
  return Object.fromEntries(keys.map((k, i) => [k, counts[i]!]))
}
