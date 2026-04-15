import { api } from '../../lib/api-client'
import type { NotificationPreferences, AppNotification, SmartReminder, BatchedNotificationsResponse } from '@repo/shared/types'

export const notificationsApi = {
  getPreferences: () =>
    api.get<{ data: NotificationPreferences }>('/notifications/preferences').then((r) => r.data),

  updatePreferences: (data: Partial<NotificationPreferences>) =>
    api.patch<{ data: NotificationPreferences }>('/notifications/preferences', data).then((r) => r.data),

  registerDevice: (token: string, deviceType: 'web' | 'android' | 'ios') =>
    api.post<{ success: boolean; deviceId: string }>('/notifications/register', { token, deviceType }).then((r) => r.data),

  unregisterDevice: (token: string) =>
    api.delete('/notifications/register', { params: { token } }).then((r) => r.data),

  getAggregated: () =>
    api.get<{ data: AppNotification[] }>('/notifications/aggregated').then((r) => r.data),

  getSmartReminders: () =>
    api.get<{ data: SmartReminder[] }>('/notifications/smart-reminders').then((r) => r.data),

  getBatched: () =>
    api.get<{ data: BatchedNotificationsResponse }>('/notifications/batched').then((r) => r.data),
}
