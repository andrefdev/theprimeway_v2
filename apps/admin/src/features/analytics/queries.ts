import { queryOptions, useQuery } from '@tanstack/react-query'
import { getAnalyticsSummary } from './api'

export const analyticsQueries = {
  summary: () =>
    queryOptions({
      queryKey: ['analytics', 'summary'] as const,
      queryFn: getAnalyticsSummary,
    }),
}

export function useAnalyticsSummary() {
  return useQuery(analyticsQueries.summary())
}
