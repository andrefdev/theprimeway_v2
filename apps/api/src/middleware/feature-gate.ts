import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import type { FeatureKey } from '@repo/shared/constants'
import { featuresService } from '../services/features.service'

/**
 * Middleware factory that guards a route behind a feature flag.
 * Resolves features lazily (cached after first call per request).
 * Usage: chatRoutes.use('*', requireFeature('AI_ASSISTANT'))
 */
export function requireFeature(featureKey: FeatureKey) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const userId = c.get('user').userId
    const appVersion = c.req.header('X-App-Version')

    // Resolve and cache on context for this request
    let features = c.get('features')
    if (!features) {
      features = await featuresService.resolveFeatures(userId, appVersion ?? undefined)
      c.set('features', features)
    }

    const feature = features[featureKey]
    if (!feature?.enabled) {
      return c.json(
        { error: 'Feature not available', feature: featureKey, reason: feature?.reason ?? 'plan' },
        403,
      )
    }

    await next()
  })
}
