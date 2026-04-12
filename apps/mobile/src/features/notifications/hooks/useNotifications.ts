import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { notificationsService } from '../services/notificationsService';

// Export as const for use in invalidateQueries
export const notificationsQueryKey = queryKeys.notifications.aggregated;

export function useAggregatedNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: notificationsService.getAggregated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
