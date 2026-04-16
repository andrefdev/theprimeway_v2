import { api } from '@/shared/lib/api-client'

export interface UserSettings {
  locale: string
  theme: string
  timezone: string
  baseCurrency: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export const settingsApi = {
  getSettings: () => api.get<{ data: UserSettings }>('/user/settings'),
  updateSettings: (settings: UserSettings) => api.put('/user/settings', settings),
  changePassword: (payload: PasswordChangeRequest) => api.put('/user/password', payload),
}
