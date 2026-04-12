import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const calendarQueries = {
  all: () => ['calendar'] as const,

  accounts: () =>
    queryOptions({
      queryKey: [...calendarQueries.all(), 'accounts'],
      queryFn: () => calendarApi.listAccounts(),
      staleTime: CACHE_TIMES.standard,
    }),

  googleEvents: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...calendarQueries.all(), 'google-events', params],
      queryFn: () => calendarApi.getGoogleEvents(params),
      staleTime: CACHE_TIMES.short,
    }),
}

export function useDeleteCalendarAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => calendarApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueries.all() })
    },
  })
}

export function useSyncCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => calendarApi.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueries.all() })
    },
  })
}
