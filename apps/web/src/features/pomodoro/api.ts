import { api } from '@/shared/lib/api-client'
import type { PomodoroSession, PomodoroStats } from '@repo/shared/types'
import type { CreatePomodoroSessionInput, UpdatePomodoroSessionInput } from '@repo/shared/validators'

interface SessionsResponse {
  data: PomodoroSession[]
  count: number
}

export const pomodoroApi = {
  listSessions: (params?: Record<string, string>) =>
    api.get<SessionsResponse>('/pomodoro/sessions', { params }).then((r) => r.data),

  getSession: (id: string) =>
    api.get<{ data: PomodoroSession }>(`/pomodoro/sessions/${id}`).then((r) => r.data),

  createSession: (data: CreatePomodoroSessionInput) =>
    api.post<{ data: PomodoroSession }>('/pomodoro/sessions', data).then((r) => r.data),

  updateSession: (id: string, data: UpdatePomodoroSessionInput) =>
    api.patch<{ data: PomodoroSession }>(`/pomodoro/sessions/${id}`, data).then((r) => r.data),

  deleteSession: (id: string) =>
    api.delete(`/pomodoro/sessions/${id}`).then((r) => r.data),

  getStats: () =>
    api.get<{ data: PomodoroStats }>('/pomodoro/stats').then((r) => r.data),
}
