import type { AuthUser } from '../middleware/auth'
import type { ResolvedFeatureSet } from '@repo/shared/types'

export type AppEnv = {
  Variables: {
    user: AuthUser
    features?: ResolvedFeatureSet // lazily populated by requireFeature middleware
  }
}
