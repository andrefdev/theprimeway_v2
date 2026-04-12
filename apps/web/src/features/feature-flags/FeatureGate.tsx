import type { ReactNode } from 'react'
import type { FeatureKey } from '@repo/shared/constants'
import { useFeature } from './hooks'

interface FeatureGateProps {
  feature: FeatureKey
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Renders children only when the feature is enabled.
 * Shows fallback (or nothing) otherwise.
 * During loading, renders children optimistically (prevents flicker).
 */
export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { enabled, isLoading } = useFeature(feature)
  if (isLoading) return <>{children}</> // optimistic render
  if (!enabled) return fallback ? <>{fallback}</> : null
  return <>{children}</>
}
