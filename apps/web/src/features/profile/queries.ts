import { useMutation } from '@tanstack/react-query'
import { profileApi, type ProfileUpdateRequest } from './api'

export const profileQueries = {
  all: () => ['profile'] as const,
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (payload: ProfileUpdateRequest) => profileApi.updateProfile(payload),
  })
}
