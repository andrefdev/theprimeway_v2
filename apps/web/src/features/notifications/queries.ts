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
}
