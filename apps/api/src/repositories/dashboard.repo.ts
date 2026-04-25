import { prisma } from '../lib/prisma'

class DashboardRepository {
  todayTasks(userId: string, dayStart: Date, dayEnd: Date) {
    return prisma.task.findMany({
      where: { userId, scheduledDate: { gte: dayStart, lte: dayEnd } },
      select: { status: true },
    })
  }

  overdueCount(userId: string, dayStart: Date) {
    return prisma.task.count({
      where: { userId, status: 'open', dueDate: { lt: dayStart } },
    })
  }

  activeHabits(userId: string) {
    return prisma.task.findMany({
      where: { userId, kind: 'HABIT', archivedAt: null },
      select: { id: true },
    })
  }

  todayHabitLogs(userId: string, dayStart: Date, dayEnd: Date) {
    return prisma.habitLog.findMany({
      where: { userId, date: { gte: dayStart, lt: dayEnd } },
      select: { taskId: true, completedCount: true },
    })
  }

  gamificationProfile(userId: string) {
    return prisma.gamificationProfile.findFirst({
      where: { userId },
      select: { level: true, totalXp: true, currentStreak: true },
    })
  }
}

export const dashboardRepo = new DashboardRepository()
