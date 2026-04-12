import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@shared/api/client'
import { queryKeys } from '@shared/api/queryKeys'
import { FEATURES } from '@shared/api/endpoints'
import { useFeaturesStore } from '@shared/stores/featuresStore'
import { useAuthStore } from '@shared/stores/authStore'
import Constants from 'expo-constants'
import type { FeatureKey } from '@repo/shared/constants'
import type { FeaturesResponse, FeatureValue } from '@repo/shared/types'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

export function useFeatures() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { features: offlineFeatures, setFeatures } = useFeaturesStore()

  const query = useQuery({
    queryKey: queryKeys.features.resolved,
    queryFn: async () => {
      const { data } = await apiClient.get<FeaturesResponse>(FEATURES.RESOLVED, {
        headers: { 'X-App-Version': APP_VERSION },
      })
      setFeatures(data.data, data.resolvedAt)
      return data
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 24 * 60 * 60 * 1000, // 24h
  })

  return {
    features: query.data?.data ?? offlineFeatures ?? null,
    isLoading: query.isLoading,
    isOffline: !query.data && !!offlineFeatures,
  }
}

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
