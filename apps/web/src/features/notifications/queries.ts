import { queryOptions } from '@tanstack/react-query'
import { notificationsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const notificationQueries = {
  all: () => ['notifications'] as const,

  preferences: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'preferences'],
      queryFn: () => notificationsApi.getPreferences(),
      staleTime: CACHE_TIMES.standard,
    }),

  aggregated: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'aggregated'],
      queryFn: () => notificationsApi.getAggregated(),
      staleTime: 2 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
    }),

  smartReminders: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'smart-reminders'],
      queryFn: () => notificationsApi.getSmartReminders(),
      staleTime: 5 * 60 * 1000,
    }),

  batched: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'batched'],
      queryFn: () => notificationsApi.getBatched(),
      staleTime: 2 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
    }),
}
