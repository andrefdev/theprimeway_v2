import { api } from '@/shared/lib/api-client'
import type { NotificationPreferences, AppNotification, SmartReminder, BatchedNotificationsResponse } from '@repo/shared/types'

export interface InboxNotification {
  id: string
  type: string
  entityId: string | null
  title: string
  message: string
  href: string | null
  urgency: string | null
  data: unknown
  readAt: string | null
  dismissedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InboxResponse {
  data: InboxNotification[]
  count: number
  unread: number
}

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

  getInbox: (opts?: { includeRead?: boolean; includeDismissed?: boolean; limit?: number; offset?: number }) =>
    api
      .get<InboxResponse>('/notifications/inbox', {
        params: {
          ...(opts?.includeRead !== undefined ? { includeRead: String(opts.includeRead) } : {}),
          ...(opts?.includeDismissed !== undefined ? { includeDismissed: String(opts.includeDismissed) } : {}),
          ...(opts?.limit !== undefined ? { limit: String(opts.limit) } : {}),
          ...(opts?.offset !== undefined ? { offset: String(opts.offset) } : {}),
        },
      })
      .then((r) => r.data),

  markRead: (id: string) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  dismiss: (id: string) => api.post(`/notifications/${id}/dismiss`).then((r) => r.data),
  remove: (id: string) => api.delete(`/notifications/${id}`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/inbox/mark-all-read').then((r) => r.data),
  dismissAll: () => api.post('/notifications/inbox/dismiss-all').then((r) => r.data),
}
