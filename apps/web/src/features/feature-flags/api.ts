import { api } from '../../lib/api-client'
import type { FeaturesResponse } from '@repo/shared/types'

export const featuresApi = {
  getFeatures: () =>
    api
      .get<FeaturesResponse>('/features', {
        headers: { 'X-App-Version': import.meta.env.VITE_APP_VERSION ?? '1.0.0' },
      })
      .then((r) => r.data),
}
