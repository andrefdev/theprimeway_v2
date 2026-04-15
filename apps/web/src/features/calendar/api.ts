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

  createTimeBlock: (input: {
    title: string
    date: string
    startTime: string
    endTime: string
    description?: string
    color?: string
  }) =>
    api
      .post<{ data: { success: boolean; eventId?: string } }>('/calendar/time-block', input)
      .then((r) => r.data.data),

  createHabitBlock: (input: {
    habitId: string
    habitName: string
    startTime: string
    endTime: string
    frequencyType: string
    weekDays?: string[]
    description?: string
    color?: string
  }) =>
    api
      .post<{ data: { success: boolean; eventId?: string } }>('/calendar/habit-block', input)
      .then((r) => r.data.data),

  getFreeSlots: (date: string, duration: number) =>
    api
      .get<{ freeSlots: Array<{ start: string; end: string; durationMinutes: number }> }>(
        '/calendar/free-slots',
        { params: { date, duration: String(duration) } },
      )
      .then((r) => r.data),
}
