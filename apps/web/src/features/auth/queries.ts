import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from './api'
import { useAuthStore } from '../../stores/auth.store'
import { useFeaturesStore } from '../../stores/features.store'
import { featureQueries } from '../feature-flags/queries'
import type { LoginInput, RegisterInput } from '@repo/shared/validators'

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'],
      queryFn: () => authApi.me(),
      staleTime: 5 * 60 * 1000,
      retry: false,
    }),
}

export function useLogin() {
  const loginSuccess = useAuthStore((s) => s.loginSuccess)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (data) => {
      loginSuccess(data.token, data.refreshToken, data.user)
      queryClient.invalidateQueries({ queryKey: featureQueries.all() })
    },
  })
}

export function useRegister() {
  const loginSuccess = useAuthStore((s) => s.loginSuccess)

  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: (data) => {
      loginSuccess(data.token, data.refreshToken, data.user)
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const clearFeatures = useFeaturesStore((s) => s.clearFeatures)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      clearFeatures()
      queryClient.clear()
    },
  })
}
