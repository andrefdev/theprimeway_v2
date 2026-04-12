import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { subscriptionService } from '../services/subscriptionService';

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: queryKeys.subscription.status,
    queryFn: () => subscriptionService.getStatus(),
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscription.plans,
    queryFn: () => subscriptionService.getPlans(),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (planId: string) => subscriptionService.createCheckout(planId),
  });
}
