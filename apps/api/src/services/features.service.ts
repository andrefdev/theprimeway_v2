import { FEATURES, VERSION_GATES } from '@repo/shared/constants'
import type { FeatureKey } from '@repo/shared/constants'
import type { ResolvedFeatureSet, FeatureValue } from '@repo/shared/types'
import { featuresRepo } from '../repositories/features.repo'
import { plansRepo } from '../repositories/plans.repo'
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

/** Clear all cached resolutions. Call when global free-plan defaults change. */
export function bustAllFeatureCaches() {
  cache.clear()
  freePlanCache = null
}

// Free-plan record cache (separate, short-lived)
let freePlanCache: { plan: Record<string, unknown> | null; expiresAt: number } | null = null
async function loadFreePlan(): Promise<Record<string, unknown> | null> {
  if (freePlanCache && freePlanCache.expiresAt > Date.now()) return freePlanCache.plan
  try {
    const plan = await plansRepo.findByName('free')
    freePlanCache = { plan: plan as unknown as Record<string, unknown> | null, expiresAt: Date.now() + CACHE_TTL_MS }
    return freePlanCache.plan
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Plan defaults — maps SubscriptionPlan fields to feature values
// ---------------------------------------------------------------------------
function planDefaults(plan: Record<string, unknown> | null | undefined): ResolvedFeatureSet {
  const p = plan ?? {}
  const hasPlan = plan !== null && plan !== undefined

  const bool = (field: string, fallback: boolean): FeatureValue => ({
    enabled: hasPlan ? Boolean(p[field] ?? fallback) : fallback,
    reason: null,
  })
  const limit = (field: string, fallback: number): FeatureValue => ({
    enabled: true, // "enabled" for limit features means "the gate exists"
    limit: hasPlan ? (Number(p[field]) || fallback) : fallback,
    reason: null,
  })

  return {
    // Module-specific gates
    [FEATURES.AI_ASSISTANT]: bool('hasAiAssistant', false),
    [FEATURES.BRAIN_MODULE]: bool('hasBrainModule', false),
    [FEATURES.BRAIN_GRAPH]: bool('hasBrainGraph', false),
    // Transversal features
    [FEATURES.ADVANCED_ANALYTICS]: bool('hasAdvancedAnalytics', false),
    [FEATURES.CUSTOM_THEME_CREATION]: bool('hasCustomThemeCreation', false),
    [FEATURES.CUSTOM_THEMES]: bool('hasCustomThemeCreation', false),
    [FEATURES.EXPORT_DATA]: bool('hasExportData', false),
    [FEATURES.PRIORITY_SUPPORT]: bool('hasPrioritySupport', false),
    // Numeric limits
    [FEATURES.HABITS_LIMIT]: limit('maxHabits', 5),
    [FEATURES.GOALS_LIMIT]: limit('maxGoals', 3),
    [FEATURES.TASKS_LIMIT]: limit('maxTasks', 20),
    [FEATURES.POMODORO_DAILY_LIMIT]: limit('maxPomodoroSessionsDaily', 10),
    [FEATURES.BRAIN_ENTRIES_LIMIT]: limit('maxBrainEntries', 20),
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

    // 2. Start from plan defaults. If no subscription, fall back to the global
    //    free plan stored in DB so admins can edit free-tier limits.
    const subPlan = subscription?.plan as Record<string, unknown> | null | undefined
    const effectivePlan = subPlan ?? (await loadFreePlan())
    const resolved = planDefaults(effectivePlan ?? null)

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
        (resolved as Record<FeatureKey, FeatureValue>)[fk] = {
          ...(resolved as Record<FeatureKey, FeatureValue>)[fk],
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
