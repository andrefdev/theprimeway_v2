import { api } from '../../lib/api-client'

interface CalendarAccount {
  id: string
  provider: string
  email: string
  isActive: boolean
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  isAllDay: boolean
  location?: string
}

interface ListResponse<T> {
  data: T[]
  count: number
}

export const calendarApi = {
  listAccounts: () =>
    api.get<ListResponse<CalendarAccount>>('/calendar/accounts').then((r) => r.data),

  deleteAccount: (id: string) =>
    api.delete(`/calendar/accounts/${id}`).then((r) => r.data),

  getGoogleConnectUrl: () =>
    api.get<{ data: { url: string } }>('/calendar/google/connect').then((r) => r.data),

  getGoogleEvents: (params?: Record<string, string>) =>
    api.get<ListResponse<CalendarEvent>>('/calendar/google/events', { params }).then((r) => r.data),

  sync: () =>
    api.post('/calendar/sync').then((r) => r.data),
}
