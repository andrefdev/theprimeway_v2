import { useQuery } from '@tanstack/react-query'
import { featureQueries } from './queries'
import { useFeaturesStore } from '../../stores/features.store'
import { useAuthStore } from '../../stores/auth.store'
import type { FeatureKey } from '@repo/shared/constants'
import type { FeatureValue } from '@repo/shared/types'

/** Primary hook — fetches from server, falls back to Zustand cache offline */
export function useFeatures() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const offlineFeatures = useFeaturesStore((s) => s.features)

  const query = useQuery({
    ...featureQueries.resolved(),
    enabled: isAuthenticated,
  })

  return {
    features: query.data?.data ?? offlineFeatures ?? null,
    isLoading: query.isLoading,
    isOffline: !query.data && !!offlineFeatures,
  }
}

/** Convenience hook for a single feature */
export function useFeature(key: FeatureKey): FeatureValue & { isLoading: boolean } {
  const { features, isLoading } = useFeatures()
  const feature = features?.[key]
  return {
    enabled: feature?.enabled ?? false,
    limit: feature?.limit,
    reason: feature?.reason,
    isLoading,
  }
}
