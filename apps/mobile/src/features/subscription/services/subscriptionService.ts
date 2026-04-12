import { apiClient } from '@shared/api/client';
import { SUBSCRIPTION } from '@shared/api/endpoints';
import type { SubscriptionPlan, UserSubscription } from '@shared/types/models';

export const subscriptionService = {
  getPlans: async () => {
    const { data } = await apiClient.get<SubscriptionPlan[]>(SUBSCRIPTION.PLANS);
    return data;
  },

  getStatus: async () => {
    const { data } = await apiClient.get<UserSubscription>(SUBSCRIPTION.STATUS);
    return data;
  },

  createCheckout: async (planId: string) => {
    const { data } = await apiClient.post<{ url: string }>(SUBSCRIPTION.CHECKOUT, { planId });
    return data;
  },
};
