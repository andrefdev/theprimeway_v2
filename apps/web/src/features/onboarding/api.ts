import { api } from '@/shared/lib/api-client'

export interface OnboardingPreferences {
  locale: string
  onboardingCompleted: boolean
  focusAreas: string[]
  dailyGoalMinutes: number
}

export const onboardingApi = {
  updateProfile: (data: { name: string }) =>
    api.patch('/user/profile', data).then((r) => r.data),

  savePreferences: (data: OnboardingPreferences) =>
    api.put('/user/settings', data).then((r) => r.data),
}
