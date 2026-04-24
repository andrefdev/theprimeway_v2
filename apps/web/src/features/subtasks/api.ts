import { api } from '@/shared/lib/api-client'

export interface Subtask {
  id: string
  taskId: string
  title: string
  isCompleted: boolean
  plannedTimeMinutes: number | null
  actualTimeMinutes: number
  position: number
  createdAt: string
  updatedAt: string
}

export const subtasksApi = {
  list: (taskId: string) =>
    api.get<{ data: Subtask[] }>(`/tasks/${taskId}/subtasks`).then((r) => r.data.data),

  create: (taskId: string, input: { title: string; plannedTimeMinutes?: number }) =>
    api.post<{ data: Subtask }>(`/tasks/${taskId}/subtasks`, input).then((r) => r.data.data),

  update: (id: string, input: Partial<{ title: string; isCompleted: boolean; plannedTimeMinutes: number | null; position: number }>) =>
    api.patch<{ data: Subtask }>(`/subtasks/${id}`, input).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/subtasks/${id}`).then((r) => r.data),
}
