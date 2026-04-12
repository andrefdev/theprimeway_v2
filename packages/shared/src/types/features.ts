import type { FeatureKey } from '../constants/features'

/** What the API returns for each feature */
export interface FeatureValue {
  enabled: boolean
  /** For limit-type features: the cap (-1 = unlimited) */
  limit?: number
  /** Why it's disabled — useful for UI copy decisions */
  reason?: 'plan' | 'version' | 'override' | null
}

/** The full resolved set — a record keyed by FeatureKey */
export type ResolvedFeatureSet = Record<FeatureKey, FeatureValue>

/** Shape of GET /api/features response */
export interface FeaturesResponse {
  data: ResolvedFeatureSet
  /** ISO timestamp — clients use this to know when to re-fetch */
  resolvedAt: string
}
