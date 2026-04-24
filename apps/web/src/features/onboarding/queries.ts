import { useMutation } from '@tanstack/react-query'
import { onboardingApi, type OnboardingPreferences } from './api'

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: async (data: { name?: string; preferences: OnboardingPreferences }) => {
      if (data.name) {
        await onboardingApi.updateProfile({ name: data.name })
      }
      await onboardingApi.savePreferences(data.preferences)
      await onboardingApi.completeOnboarding({
        locale: data.preferences.locale,
      })
    },
  })
}
