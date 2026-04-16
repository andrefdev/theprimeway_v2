import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResolvedFeatureSet } from '@repo/shared/types'

interface FeaturesState {
  features: ResolvedFeatureSet | null
  resolvedAt: string | null
  setFeatures: (features: ResolvedFeatureSet, resolvedAt: string) => void
  clearFeatures: () => void
}

export const useFeaturesStore = create<FeaturesState>()(
  persist(
    (set) => ({
      features: null,
      resolvedAt: null,
      setFeatures: (features, resolvedAt) => set({ features, resolvedAt }),
      clearFeatures: () => set({ features: null, resolvedAt: null }),
    }),
    {
      name: 'theprimeway-features',
    },
  ),
)
