import { useMutation } from '@tanstack/react-query'
import { settingsApi, type UserSettings, type PasswordChangeRequest } from './api'

export const settingsQueries = {
  all: () => ['settings'] as const,
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (settings: UserSettings) => settingsApi.updateSettings(settings),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: PasswordChangeRequest) => settingsApi.changePassword(payload),
  })
}
