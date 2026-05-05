import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { CACHE_TIMES } from '@repo/shared/constants'
import { authApi, isVerificationPending } from './api'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useFeaturesStore } from '@/shared/stores/features.store'
import { featureQueries } from '@/features/feature-flags/queries'
import type { LoginInput, RegisterInput } from '@repo/shared/validators'

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'],
      queryFn: () => authApi.me(),
      staleTime: CACHE_TIMES.standard,
      retry: false,
    }),
}

export function useLogin() {
  const loginSuccess = useAuthStore((s) => s.loginSuccess)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (data) => {
      if (isVerificationPending(data)) return
      loginSuccess(data.token, data.refreshToken, data.user)
      queryClient.invalidateQueries({ queryKey: featureQueries.all() })
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
  })
}

export function useVerifyEmail() {
  const loginSuccess = useAuthStore((s) => s.loginSuccess)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authApi.verifyEmail(email, code),
    onSuccess: (data) => {
      loginSuccess(data.token, data.refreshToken, data.user)
      queryClient.invalidateQueries({ queryKey: featureQueries.all() })
    },
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: ({ email, purpose }: { email: string; purpose: 'register' | 'reset' }) =>
      authApi.resendOtp(email, purpose),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ email, code, password }: { email: string; code: string; password: string }) =>
      authApi.resetPassword(email, code, password),
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

export function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: (data: { confirmEmail: string; password?: string; reason?: string }) =>
      authApi.requestAccountDeletion(data),
  })
}

export function useConfirmAccountDeletion() {
  const logout = useAuthStore((s) => s.logout)
  const clearFeatures = useFeaturesStore((s) => s.clearFeatures)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => authApi.confirmAccountDeletion(code),
    onSuccess: () => {
      logout()
      clearFeatures()
      queryClient.clear()
    },
  })
}
