import { apiClient } from '@shared/api/client';
import { NOTIFICATIONS } from '@shared/api/endpoints';

export interface AppNotification {
  id: string;
  type: 'overdue_task' | 'missed_habit' | 'pending_transaction';
  title: string;
  message: string;
  href: string;
  created_at: string;
}

export interface AggregatedNotificationsResponse {
  data: AppNotification[];
  count: number;
}

export const notificationsService = {
  getAggregated: async (): Promise<AggregatedNotificationsResponse> => {
    const { data: response } = await apiClient.get<AggregatedNotificationsResponse>(
      NOTIFICATIONS.AGGREGATED
    );
    return {
      data: response?.data ?? [],
      count: response?.count ?? 0,
    };
  },
};
