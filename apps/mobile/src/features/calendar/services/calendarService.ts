import { apiClient } from '@shared/api/client';
import { CALENDAR } from '@shared/api/endpoints';
import type { CalendarAccount, CalendarEvent } from '@shared/types/models';

export const calendarService = {
  getAccounts: async () => {
    const { data } = await apiClient.get<CalendarAccount[]>(CALENDAR.ACCOUNTS);
    return data;
  },

  getEvents: async (params?: { start?: string; end?: string }) => {
    const { data } = await apiClient.get<CalendarEvent[]>(CALENDAR.GOOGLE_EVENTS, { params });
    return data;
  },

  connectGoogle: async (code: string) => {
    const { data } = await apiClient.post(CALENDAR.GOOGLE_CONNECT, { code });
    return data;
  },

  syncCalendar: async () => {
    const { data } = await apiClient.post(CALENDAR.SYNC);
    return data;
  },

  getCalendars: async () => {
    const { data } = await apiClient.get(CALENDAR.CALENDARS);
    return data;
  },
};
