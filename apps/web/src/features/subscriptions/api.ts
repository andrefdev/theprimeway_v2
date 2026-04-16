import { api } from '@/shared/lib/api-client'
import type { SubscriptionPlan, SubscriptionStatus } from '@repo/shared/types'

export const subscriptionsApi = {
  getPlans: () =>
    api.get<{ data: SubscriptionPlan[] }>('/subscriptions/plans').then((r) => r.data),

  getStatus: () =>
    api.get<{ data: SubscriptionStatus }>('/subscriptions/status').then((r) => r.data),

  startTrial: () =>
    api.post<{ data: SubscriptionStatus }>('/subscriptions/status', { action: 'start_trial' }).then((r) => r.data),

  createCheckout: (variantId: string) =>
    api.post<{ url: string }>('/subscriptions/checkout', { variantId }).then((r) => r.data),
}
