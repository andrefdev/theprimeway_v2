import { api } from '@/shared/lib/api-client'

export type RecurrencePattern = 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY'

export interface RecurringSeries {
  id: string
  userId: string
  templateTaskJson: Record<string, unknown>
  pattern: RecurrencePattern
  daysOfWeek: number[]
  atRoughlyTime: string | null
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface RecurringInput {
  templateTaskJson: Record<string, unknown>
  pattern: RecurrencePattern
  daysOfWeek?: number[]
  atRoughlyTime?: string
  startDate: string
  endDate?: string
}

export const recurringApi = {
  list: () => api.get<{ data: RecurringSeries[] }>('/recurring-series').then((r) => r.data.data),
  create: (body: RecurringInput) =>
    api.post<{ data: RecurringSeries }>('/recurring-series', body).then((r) => r.data.data),
  update: (id: string, body: Partial<RecurringInput>) =>
    api.patch<{ data: RecurringSeries }>(`/recurring-series/${id}`, body).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/recurring-series/${id}`).then((r) => r.data),
  materialize: (referenceDate?: string) =>
    api
      .post<{ data: { created: number; skipped: number; seriesChecked: number } }>(
        '/recurring-series/materialize',
        referenceDate ? { referenceDate } : {},
      )
      .then((r) => r.data.data),
}
