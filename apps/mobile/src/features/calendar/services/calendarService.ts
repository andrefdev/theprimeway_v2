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

  getEvent: async (calendarId: string, eventId: string): Promise<CalendarEvent> => {
    const { data } = await apiClient.get<{ data: CalendarEvent }>(
      CALENDAR.EVENT_BY_ID(calendarId, eventId)
    );
    return (data as any)?.data ?? (data as unknown as CalendarEvent);
  },

  updateEvent: async (
    calendarId: string,
    eventId: string,
    patch: Partial<CalendarEvent>
  ): Promise<CalendarEvent> => {
    const { data } = await apiClient.patch<{ data: CalendarEvent }>(
      CALENDAR.EVENT_BY_ID(calendarId, eventId),
      patch
    );
    return (data as any)?.data ?? (data as unknown as CalendarEvent);
  },

  deleteEvent: async (calendarId: string, eventId: string): Promise<void> => {
    await apiClient.delete(CALENDAR.EVENT_BY_ID(calendarId, eventId));
  },

  getSmartSlots: async (taskId: string, date: string) => {
    const { data } = await apiClient.get(CALENDAR.SMART_SLOTS, {
      params: { taskId, date },
    });
    return (data as any)?.data ?? data;
  },
};
