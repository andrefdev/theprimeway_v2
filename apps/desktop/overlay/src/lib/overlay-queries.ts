import { queryOptions } from '@tanstack/react-query'
import type { Task, PomodoroSession, Habit, HabitLog } from '@repo/shared'
import { overlayApi } from './api-client'

const OVERLAY_POLL_MS = 30_000
const TIMER_POLL_MS = 15_000
const DASHBOARD_POLL_MS = 30_000

export type HabitWithTodayLog = Habit & { todayLog?: HabitLog | null }

interface DashboardSummary {
  tasksOpenCount: number
  tasksCompletedToday: number
  currentStreak?: number
  todayXP?: number
  gamification?: {
    currentStreak?: number
  }
}

// Live timer treats `durationMinutes` as the planned length; PomodoroSession
// from shared package matches this shape.
export type OverlaySession = PomodoroSession

export const overlayQueries = {
  todayTasks: () =>
    queryOptions({
      queryKey: ['overlay', 'tasks', 'today'],
      queryFn: async () => {
        const today = new Date().toISOString().split('T')[0]
        const res = await overlayApi.get<{ data: Task[] }>('/tasks', {
          params: { filter: 'today', referenceDate: today },
        })
        return res.data.data
      },
      staleTime: OVERLAY_POLL_MS,
      refetchInterval: OVERLAY_POLL_MS,
      refetchIntervalInBackground: false,
      retry: 1,
    }),

  activeSession: () =>
    queryOptions({
      queryKey: ['overlay', 'pomodoro', 'active'],
      queryFn: async () => {
        const res = await overlayApi.get<{ data: PomodoroSession[] }>('/pomodoro/sessions', {
          params: { isCompleted: 'false', limit: '1' },
        })
        return res.data.data[0] ?? null
      },
      staleTime: TIMER_POLL_MS,
      refetchInterval: TIMER_POLL_MS,
      retry: 1,
    }),

  todayHabits: () =>
    queryOptions({
      queryKey: ['overlay', 'habits', 'today'],
      queryFn: async () => {
        const today = new Date().toISOString().split('T')[0]
        const res = await overlayApi.get<{ data: HabitWithTodayLog[] }>('/habits', {
          params: { isActive: 'true', includeLogs: 'true', applicableDate: today },
        })
        return res.data.data
      },
      staleTime: OVERLAY_POLL_MS,
      refetchInterval: OVERLAY_POLL_MS,
      retry: 1,
    }),

  dashboardSummary: () =>
    queryOptions({
      queryKey: ['overlay', 'dashboard'],
      queryFn: async () => {
        const res = await overlayApi.get<{ data: DashboardSummary }>('/dashboard/summary')
        return res.data.data
      },
      staleTime: DASHBOARD_POLL_MS,
      refetchInterval: DASHBOARD_POLL_MS,
      retry: 1,
    }),
}
