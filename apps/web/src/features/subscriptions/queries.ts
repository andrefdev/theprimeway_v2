import { queryOptions } from '@tanstack/react-query'
import { subscriptionsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const subscriptionQueries = {
  all: () => ['subscriptions'] as const,

  plans: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), 'plans'],
      queryFn: () => subscriptionsApi.getPlans(),
      staleTime: CACHE_TIMES.day,
    }),

  status: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), 'status'],
      queryFn: () => subscriptionsApi.getStatus(),
      staleTime: CACHE_TIMES.standard,
    }),
}
