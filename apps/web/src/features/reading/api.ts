import { api } from '@/shared/lib/api-client'
import type { Book } from '@repo/shared/types'

interface ListResponse<T> {
  data: T[]
  count: number
}

export const readingApi = {
  listBooks: (params?: Record<string, string>) =>
    api.get<ListResponse<Book>>('/reading/books', { params }).then((r) => r.data),

  getBook: (id: string) =>
    api.get<{ data: Book }>(`/reading/books/${id}`).then((r) => r.data),

  addBook: (data: Record<string, unknown>) =>
    api.post<{ data: Book }>('/reading/books', data).then((r) => r.data),

  updateBook: (id: string, data: Record<string, unknown>) =>
    api.patch<{ data: Book }>(`/reading/books/${id}`, data).then((r) => r.data),

  deleteBook: (id: string) =>
    api.delete(`/reading/books/${id}`).then((r) => r.data),

  stats: () =>
    api.get<{ data: Record<string, unknown> }>('/reading/stats').then((r) => r.data),

  listGoals: () =>
    api.get<ListResponse<Record<string, unknown>>>('/reading/goals').then((r) => r.data),

  createGoal: (data: Record<string, unknown>) =>
    api.post('/reading/goals', data).then((r) => r.data),
}
