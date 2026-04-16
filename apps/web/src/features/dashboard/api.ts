import { api } from '@/shared/lib/api-client'

export interface DashboardSummary {
  tasks: {
    todayTotal: number
    todayCompleted: number
    overdueCount: number
  }
  habits: {
    activeCount: number
    completedToday: number
  }
  finances: {
    totalBalance: number
    accountCount: number
  }
  gamification: {
    level: number
    totalXp: number
    currentStreak: number
  }
}

export const dashboardApi = {
  getSummary: () =>
    api.get<{ data: DashboardSummary }>('/dashboard/summary').then((r) => r.data),

  getTodayTasks: (referenceDate: string) =>
    api.get('/tasks', { params: { filter: 'today', referenceDate } }).then((r) => r.data),
}
