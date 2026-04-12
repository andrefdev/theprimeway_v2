import { api } from '../../lib/api-client'
import type { Habit, HabitLog, HabitStats } from '@repo/shared/types'
import type { CreateHabitInput, UpdateHabitInput, UpsertHabitLogInput } from '@repo/shared/validators'

interface HabitsResponse {
  data: Habit[]
  count: number
}

export const habitsApi = {
  list: (params?: Record<string, string>) =>
    api.get<HabitsResponse>('/habits', { params }).then((r) => r.data),

  get: (id: string, includeLogs = false) =>
    api.get<Habit>(`/habits/${id}`, { params: includeLogs ? { includeLogs: 'true' } : undefined }).then((r) => r.data),

  create: (data: CreateHabitInput) =>
    api.post<Habit>('/habits', data).then((r) => r.data),

  update: (id: string, data: Partial<UpdateHabitInput>) =>
    api.patch<Habit>(`/habits/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/habits/${id}`).then((r) => r.data),

  getLogs: (habitId: string, params?: Record<string, string>) =>
    api.get<{ data: HabitLog[]; count: number }>(`/habits/${habitId}/logs`, { params }).then((r) => r.data),

  upsertLog: (habitId: string, data: UpsertHabitLogInput) =>
    api.post<HabitLog>(`/habits/${habitId}/logs`, data).then((r) => r.data),

  getStats: (params?: Record<string, string>) =>
    api.get<HabitStats>('/habits/stats', { params }).then((r) => r.data),

  // AI Methods
  analyzeHabit: (habitId: string) =>
    api
      .get<{
        data: {
          habit: { id: string; name: string }
          metrics: {
            completionRate: number
            currentStreak: number
            longestStreak: number
            totalCompletions: number
            daysTracked: number
          }
          patterns: {
            bestDaysOfWeek: number[]
            consistencyLevel: 'excellent' | 'good' | 'fair' | 'poor'
          }
          insights: string[]
        }
      }>(`/habits/${habitId}/ai/analyze`)
      .then((r) => r.data.data),

  getOptimalReminderTime: (habitId: string) =>
    api
      .get<{
        data: {
          habitId: string
          suggestedTime: string
          confidence: number
          reason: string
        }
      }>(`/habits/${habitId}/ai/optimal-time`)
      .then((r) => r.data.data),

  suggestGoalsForHabit: (habitId: string) =>
    api
      .post<{
        data: {
          linkedGoal: { id: string; title: string } | null
          suggestions: {
            weeklyGoals: Array<{ id: string; title: string; type: string }>
            quarterlyGoals: Array<{ id: string; title: string; type: string }>
            annualGoals: Array<{ id: string; title: string; type: string }>
          }
        }
      }>(`/habits/${habitId}/ai/suggest-goals`, {})
      .then((r) => r.data.data),
}
