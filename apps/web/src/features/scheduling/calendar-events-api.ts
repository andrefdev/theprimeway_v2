import { api } from '@/shared/lib/api-client'

export interface CalendarEventDTO {
  id: string
  calendarId: string
  externalId: string
  title: string
  start: string
  end: string
  isBusy: boolean
  isAllDay: boolean
}

export const calendarEventsApi = {
  list: (from: string, to: string) =>
    api
      .get<{ data: CalendarEventDTO[] }>(`/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => r.data.data),
}
