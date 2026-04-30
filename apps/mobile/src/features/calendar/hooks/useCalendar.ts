import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { calendarService } from '../services/calendarService';

export function useCalendarAccounts() {
  return useQuery({
    queryKey: queryKeys.calendar.accounts,
    queryFn: () => calendarService.getAccounts(),
  });
}

export function useCalendarEvents(params?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: [...queryKeys.calendar.events, params],
    queryFn: () => calendarService.getEvents(params),
  });
}

export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => calendarService.connectGoogle(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendar.accounts }),
  });
}

export function useSyncCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => calendarService.syncCalendar(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events }),
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      calendarId,
      eventId,
      patch,
    }: {
      calendarId: string;
      eventId: string;
      patch: Record<string, unknown>;
    }) => calendarService.updateEvent(calendarId, eventId, patch as any),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events }),
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ calendarId, eventId }: { calendarId: string; eventId: string }) =>
      calendarService.deleteEvent(calendarId, eventId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events }),
  });
}

export function useSmartSlots(taskId: string | null, date: string) {
  return useQuery({
    queryKey: ['calendar', 'smart-slots', taskId, date],
    queryFn: () => calendarService.getSmartSlots(taskId!, date),
    enabled: !!taskId,
  });
}
