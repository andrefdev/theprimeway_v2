import { api } from '../../lib/api-client'
import type { Task } from '@repo/shared/types'
import type { CreateTaskInput, UpdateTaskInput } from '@repo/shared/validators'

interface TasksResponse {
  data: Task[]
  count: number
}

interface TaskResponse {
  data: Task
}

interface ScheduleSuggestionResponse {
  data: {
    start: string
    end: string
  } | null
}

export const tasksApi = {
  list: (params?: Record<string, string>) =>
    api.get<TasksResponse>('/tasks', { params }).then((r) => r.data),

  grouped: (referenceDate: string) =>
    api.get<{ groups: Array<{ date_key: string; tasks: Task[] }>; archive: Task[] }>(
      '/tasks/grouped',
      { params: { referenceDate } },
    ).then((r) => r.data),

  get: (id: string) =>
    api.get<TaskResponse>(`/tasks/${id}`).then((r) => r.data),

  create: (data: CreateTaskInput) =>
    api.post<TaskResponse>('/tasks', data).then((r) => r.data),

  update: (id: string, data: Partial<UpdateTaskInput>) =>
    api.put<TaskResponse>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),

  stats: (referenceDate: string) =>
    api.get<{ completedToday: number; openToday: number; totalToday: number }>(
      '/tasks/stats',
      { params: { referenceDate } },
    ).then((r) => r.data),

  autoArchive: () =>
    api.post('/tasks/auto-archive').then((r) => r.data),

  getScheduleSuggestion: (
    targetDate: string,
    estimatedDuration: number,
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ) => {
    const params: Record<string, string | number> = {
      targetDate,
      estimatedDuration,
    }
    if (preferredTime) {
      params.preferredTime = preferredTime
    }
    return api
      .get<ScheduleSuggestionResponse>('/tasks/schedule/suggest', { params })
      .then((r) => r.data.data)
  },
}
