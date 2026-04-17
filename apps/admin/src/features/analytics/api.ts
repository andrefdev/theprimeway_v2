import axios from 'axios'
import { useAuthStore } from '@/features/auth/store'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface AnalyticsSummary {
  users: {
    total: number
    admins: number
    dau7d: number
    mau30d: number
  }
  subscriptions: {
    byStatus: { status: string; count: number }[]
    byPlan: { planId: string | null; planName: string; displayName: string; count: number }[]
  }
  usage: {
    totalHabits: number
    totalGoals: number
    totalNotes: number
    totalTasks: number
    dailyPomodoroSessions: number
    dailyAiRequests: number
  }
  growth30d: {
    tasks: number
    habits: number
    notes: number
    pomodoro: number
  }
  featureOverrides: { featureKey: string; enabled: number; disabled: number }[]
}

export async function getAnalyticsSummary() {
  const { data } = await api.get<{ data: AnalyticsSummary }>('/admin/analytics/summary')
  return data.data
}
