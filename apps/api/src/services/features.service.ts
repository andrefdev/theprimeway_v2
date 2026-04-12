import { FEATURES, VERSION_GATES } from '@repo/shared/constants'
import type { FeatureKey, ResolvedFeatureSet, FeatureValue } from '@repo/shared/types'
import { featuresRepo } from '../repositories/features.repo'
import { compareVersions } from '../lib/version'

// ---------------------------------------------------------------------------
// In-process cache (replace with Redis if horizontally scaled)
// ---------------------------------------------------------------------------
interface CacheEntry {
  features: ResolvedFeatureSet
  expiresAt: number
}
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 1000 // 60 seconds

export function bustFeatureCache(userId: string) {
  cache.delete(userId)
}

// ---------------------------------------------------------------------------
// Tier mapping — subscription status → tier
// ---------------------------------------------------------------------------
type Tier = 'free' | 'trial' | 'premium'

function resolveTier(subscription: { status: string | null; plan: { name: string } | null } | null): Tier {
  if (!subscription) return 'free'
  const { status } = subscription
  if (status === 'active') return 'premium'
  if (status === 'trialing') return 'trial'
  return 'free'
}

// ---------------------------------------------------------------------------
// Plan defaults — maps SubscriptionPlan fields to feature values
// ---------------------------------------------------------------------------
function planDefaults(plan: Record<string, unknown> | null | undefined): ResolvedFeatureSet {
  const unlimited = plan === null || plan === undefined // no plan = free defaults
  const p = plan ?? {}

  const bool = (field: string, fallback: boolean): FeatureValue => ({
    enabled: unlimited ? fallback : Boolean(p[field] ?? fallback),
    reason: null,
  })
  const limit = (field: string, fallback: number): FeatureValue => ({
    enabled: true, // "enabled" for limit features means "the gate exists"
    limit: unlimited ? fallback : Number(p[field]) || fallback,
    reason: null,
  })

  return {
    [FEATURES.AI_ASSISTANT]: bool('hasAiAssistant', false),
    [FEATURES.HEALTH_MODULE]: bool('hasHealthModule', false),
    [FEATURES.ADVANCED_ANALYTICS]: bool('hasAdvancedAnalytics', false),
    [FEATURES.CUSTOM_THEMES]: bool('hasCustomThemes', false),
    [FEATURES.EXPORT_DATA]: bool('hasExportData', false),
    [FEATURES.PRIORITY_SUPPORT]: bool('hasPrioritySupport', false),
    [FEATURES.HABITS_LIMIT]: limit('maxHabits', 5),
    [FEATURES.GOALS_LIMIT]: limit('maxGoals', 3),
    [FEATURES.NOTES_LIMIT]: limit('maxNotes', 50),
    [FEATURES.TASKS_LIMIT]: limit('maxTasks', 20),
    [FEATURES.POMODORO_DAILY_LIMIT]: limit('maxPomodoroSessionsDaily', 10),
  } as ResolvedFeatureSet
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------
class FeaturesService {
  async resolveFeatures(userId: string, appVersion?: string): Promise<ResolvedFeatureSet> {
    const cacheKey = `${userId}:${appVersion ?? ''}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.features
    }

    // 1. Load subscription + overrides (2 queries, run in parallel)
    const { subscription, overrides } = await featuresRepo.findUserFeatureData(userId)

    // 2. Start from plan defaults
    const resolved = planDefaults(subscription?.plan ?? null)

    // 3. Apply version gates (code-level, no DB)
    if (appVersion) {
      for (const [key, minVersion] of Object.entries(VERSION_GATES)) {
        const fk = key as FeatureKey
        if (resolved[fk] && compareVersions(appVersion, minVersion) < 0) {
          resolved[fk] = { enabled: false, reason: 'version' }
        }
      }
    }

    // 4. Apply user overrides (highest priority)
    for (const override of overrides) {
      const fk = override.featureKey as FeatureKey
      if (fk in resolved) {
        resolved[fk] = {
          ...resolved[fk],
          enabled: override.enabled,
          reason: 'override',
        }
      }
    }

    // Cache result
    cache.set(cacheKey, { features: resolved, expiresAt: Date.now() + CACHE_TTL_MS })
    return resolved
  }
}

export const featuresService = new FeaturesService()
