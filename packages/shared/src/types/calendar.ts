export interface CalendarAccount {
  id: string
  userId: string
  provider: string
  email: string
  accessToken: string | null
  refreshToken: string | null
  calendars: CalendarInfo[]
  createdAt: string
}

export interface CalendarInfo {
  id: string
  calendarAccountId: string
  externalId: string
  name: string
  color: string | null
  isPrimary: boolean
  isSelectedForSync: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  location: string | null
  calendarId: string
  calendarName: string
  color: string | null
  source: 'google' | 'local'
}
