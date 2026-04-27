import { queryOptions } from '@tanstack/react-query'
import { featuresApi } from './api'
import { useFeaturesStore } from '@/shared/stores/features.store'
import { CACHE_TIMES } from '@repo/shared/constants'

export const featureQueries = {
  all: () => ['features'] as const,

  resolved: () =>
    queryOptions({
      queryKey: [...featureQueries.all(), 'resolved'],
      queryFn: async () => {
        const result = await featuresApi.getFeatures()
        // Sync to Zustand for offline access
        useFeaturesStore.getState().setFeatures(result.data, result.resolvedAt)
        return result
      },
      staleTime: CACHE_TIMES.long, // 30 min — features don't change often
      gcTime: CACHE_TIMES.day, // 24h — survive page reloads offline
    }),

  usage: () =>
    queryOptions({
      queryKey: [...featureQueries.all(), 'usage'],
      queryFn: () => featuresApi.getUsage(),
      staleTime: CACHE_TIMES.short,
    }),
}
