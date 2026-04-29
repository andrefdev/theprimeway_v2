import { api } from '@/shared/lib/api-client'

export interface Calendar {
  id: string
  calendarAccountId: string
  providerCalendarId: string
  name: string
  color?: string | null
  isPrimary?: boolean | null
  isSelectedForSync?: boolean | null
}

export interface CalendarAccount {
  id: string
  provider: string
  email: string | null
  isPrimary?: boolean | null
  defaultTargetCalendarId?: string | null
  calendars?: Calendar[]
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
    api.get<{ data: CalendarAccount[] }>('/calendar/accounts').then((r) => r.data.data),

  deleteAccount: (id: string) =>
    api.delete('/calendar/accounts', { params: { id } }).then((r) => r.data),

  updateAccount: (id: string, body: { defaultTargetCalendarId?: string | null }) =>
    api.patch<{ data: any }>(`/calendar/accounts/${id}`, body).then((r) => r.data.data),

  updateCalendar: (
    id: string,
    body: { isSelectedForSync?: boolean; isPrimary?: boolean; color?: string },
  ) => api.patch<{ data: Calendar }>(`/calendar/calendars/${id}`, body).then((r) => r.data.data),

  getGoogleConnectUrl: () =>
    api.get<{ url: string }>('/calendar/google/connect').then((r) => r.data),

  connectGoogle: (code: string) =>
    api.post<{ data: any }>('/calendar/google/callback', { code }).then((r) => r.data.data),

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
    timeZone?: string
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

  analyzeFreeTime: (start: string, end: string) =>
    api
      .get<{ data: any }>('/calendar/free-time', { params: { start, end } })
      .then((r) => r.data.data),

  getTimeBlocks: (date: string) =>
    api
      .get<{ data: any }>('/calendar/ai/time-blocks', { params: { date } })
      .then((r) => r.data.data),

  findSmartSlots: (taskId: string, date: string) =>
    api
      .get<{ data: any }>('/calendar/ai/smart-slots', { params: { taskId, date } })
      .then((r) => r.data.data),
}
