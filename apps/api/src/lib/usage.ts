import { FEATURES, type FeatureKey } from '@repo/shared/constants'
import { prisma } from './prisma'

function startOfTodayUtc(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
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
        where: { userId, kind: 'POMODORO', start: { gte: startOfTodayUtc() } },
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
