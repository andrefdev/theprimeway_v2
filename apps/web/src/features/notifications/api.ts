import { api } from '../../lib/api-client'
import type { NotificationPreferences } from '@repo/shared/types'

export const notificationsApi = {
  getPreferences: () =>
    api.get<{ data: NotificationPreferences }>('/notifications/preferences').then((r) => r.data),

  updatePreferences: (data: Partial<NotificationPreferences>) =>
    api.patch<{ data: NotificationPreferences }>('/notifications/preferences', data).then((r) => r.data),

  registerDevice: (token: string, deviceType: 'web' | 'android' | 'ios') =>
    api.post<{ success: boolean; deviceId: string }>('/notifications/register', { token, deviceType }).then((r) => r.data),

  unregisterDevice: (token: string) =>
    api.delete('/notifications/register', { params: { token } }).then((r) => r.data),
}
