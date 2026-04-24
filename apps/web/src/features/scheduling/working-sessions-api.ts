import { api } from '@/shared/lib/api-client'

export interface WorkingSession {
  id: string
  userId: string
  taskId: string | null
  kind: 'WORK' | 'POMODORO' | 'BREAK' | 'HABIT_LOG'
  start: string
  end: string
  externalCalendarId: string | null
  externalEventId: string | null
  createdBy: 'USER' | 'AUTO_SCHEDULE' | 'AUTO_RESCHEDULE' | 'SPLIT' | 'IMPORT'
  createdAt: string
  task: { id: string; title: string; priority?: string | null } | null
}

export const workingSessionsApi = {
  list: (params: { from?: string; to?: string; taskId?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.taskId) qs.set('taskId', params.taskId)
    const suffix = qs.toString()
    return api
      .get<{ data: WorkingSession[]; count: number }>(`/working-sessions${suffix ? `?${suffix}` : ''}`)
      .then((r) => r.data.data)
  },

  remove: (id: string) =>
    api.delete<{ data: { success: boolean } }>(`/working-sessions/${id}`).then((r) => r.data),

  update: (id: string, input: Partial<Pick<WorkingSession, 'start' | 'end' | 'taskId'>>) =>
    api.patch<{ data: WorkingSession }>(`/working-sessions/${id}`, input).then((r) => r.data.data),
}
