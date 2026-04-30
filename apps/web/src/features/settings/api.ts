import { api } from '@/shared/lib/api-client'

export interface UserSettings {
  locale: string
  theme: string
  timezone: string
  baseCurrency: string
  // Scheduling (Vision-to-Execution OS)
  workloadThresholdMinutes?: number
  defaultTaskDurationMinutes?: number
  autoSchedulingGapMinutes?: number
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface CurrencySettings {
  id?: string
  userId: string
  baseCurrency: string
  preferredCurrencies: string[]
  createdAt?: string
  updatedAt?: string
}

export interface UpdateCurrencySettingsRequest {
  baseCurrency?: string
  preferredCurrencies?: string[]
}

export const settingsApi = {
  getSettings: () => api.get<{ data: UserSettings }>('/user/settings'),
  updateSettings: (settings: UserSettings) => api.put('/user/settings', settings),
  changePassword: (payload: PasswordChangeRequest) => api.put('/user/password', payload),

  getCurrencySettings: () =>
    api.get<{ data: CurrencySettings }>('/user/currency-settings').then((r) => r.data.data),

  updateCurrencySettings: (body: UpdateCurrencySettingsRequest) =>
    api
      .post<{ data: CurrencySettings }>('/user/currency-settings', body)
      .then((r) => r.data.data),

  resetCurrencySettings: () =>
    api.delete('/user/currency-settings').then((r) => r.data),
}
