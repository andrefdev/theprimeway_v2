import { format } from 'date-fns'
import { dashboardRepo } from '../repositories/dashboard.repo'

class DashboardService {
  async getSummary(userId: string) {
    const today = format(new Date(), 'yyyy-MM-dd')
    const dayStart = new Date(`${today}T00:00:00.000Z`)
    const dayEnd = new Date(`${today}T23:59:59.999Z`)

    const [todayTasks, overdueCount, activeHabits, todayHabitLogs, gamProfile] = await Promise.all([
      dashboardRepo.todayTasks(userId, dayStart, dayEnd),
      dashboardRepo.overdueCount(userId, dayStart),
      dashboardRepo.activeHabits(userId),
      dashboardRepo.todayHabitLogs(userId, dayStart, dayEnd),
      dashboardRepo.gamificationProfile(userId),
    ])

    const todayCompleted = todayTasks.filter((t: { status: string }) => t.status === 'completed').length
    const habitCompletedToday = new Set(
      todayHabitLogs
        .filter((l: { completedCount: number | null }) => (l.completedCount ?? 0) > 0)
        .map((l: { taskId: string }) => l.taskId),
    ).size

    return {
      tasks: {
        todayTotal: todayTasks.length,
        todayCompleted,
        overdueCount,
      },
      habits: {
        activeCount: activeHabits.length,
        completedToday: habitCompletedToday,
      },
      gamification: {
        level: gamProfile?.level ?? 1,
        totalXp: gamProfile?.totalXp ?? 0,
        currentStreak: gamProfile?.currentStreak ?? 0,
      },
    }
  }
}

export const dashboardService = new DashboardService()
