import { queryOptions } from '@tanstack/react-query'
import { overlayApi } from './api-client'

// Polling intervals (ms)
const OVERLAY_POLL_MS = 30_000 // 30 seconds for tasks
const TIMER_POLL_MS = 15_000 // 15 seconds for active session
const DASHBOARD_POLL_MS = 30_000 // 30 seconds for summary

// Type stubs (replace with actual types from @repo/shared)
interface Task {
  id: string
  title: string
  status: 'open' | 'completed'
  priority: 'low' | 'medium' | 'high'
  estimatedDurationMinutes?: number
  scheduledDate?: string
}

interface PomodoroSession {
  id: string
  userId: string
  taskId?: string
  sessionType: 'focus' | 'break'
  plannedDuration: number // minutes
  durationMinutes: number // alias for timer display
  actualDuration?: number
  startedAt: string // ISO 8601
  completedAt?: string
  isCompleted: boolean
  notes?: string
}

interface DashboardSummary {
  tasksOpenCount: number
  tasksCompletedToday: number
  currentStreak?: number
  todayXP?: number
  gamification?: {
    currentStreak?: number
  }
}

export const overlayQueries = {
  todayTasks: () =>
    queryOptions({
      queryKey: ['overlay', 'tasks', 'today'],
      queryFn: async () => {
        const today = new Date().toISOString().split('T')[0]
        const res = await overlayApi.get<{ data: Task[] }>(
          '/tasks',
          { params: { filter: 'today', referenceDate: today } }
        )
        return res.data.data
      },
      staleTime: OVERLAY_POLL_MS,
      refetchInterval: OVERLAY_POLL_MS,
      refetchIntervalInBackground: false, // no polling when overlay is hidden
      retry: 1,
    }),

  activeSession: () =>
    queryOptions({
      queryKey: ['overlay', 'pomodoro', 'active'],
      queryFn: async () => {
        const res = await overlayApi.get<{ data: PomodoroSession[] }>(
          '/pomodoro/sessions',
          { params: { isCompleted: 'false', limit: '1' } }
        )
        return res.data.data[0] ?? null
      },
      staleTime: TIMER_POLL_MS,
      refetchInterval: TIMER_POLL_MS,
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
