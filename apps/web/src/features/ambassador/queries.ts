import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ambassadorApi, type ApplyPayload } from './api'

export const ambassadorKeys = {
  me: () => ['ambassador', 'me'] as const,
  dashboard: () => ['ambassador', 'dashboard'] as const,
  referrals: (skip: number, take: number) => ['ambassador', 'referrals', skip, take] as const,
  commissions: (skip: number, take: number) => ['ambassador', 'commissions', skip, take] as const,
  validate: (code: string) => ['ambassador', 'validate', code] as const,
}

export function useAmbassadorMe() {
  return useQuery({
    queryKey: ambassadorKeys.me(),
    queryFn: () => ambassadorApi.me(),
    staleTime: 30_000,
  })
}

export function useAmbassadorDashboard(enabled = true) {
  return useQuery({
    queryKey: ambassadorKeys.dashboard(),
    queryFn: () => ambassadorApi.dashboard(),
    enabled,
    staleTime: 60_000,
  })
}

export function useAmbassadorReferrals(skip = 0, take = 50) {
  return useQuery({
    queryKey: ambassadorKeys.referrals(skip, take),
    queryFn: () => ambassadorApi.referrals({ skip, take }),
    staleTime: 60_000,
  })
}

export function useAmbassadorCommissions(skip = 0, take = 100) {
  return useQuery({
    queryKey: ambassadorKeys.commissions(skip, take),
    queryFn: () => ambassadorApi.commissions({ skip, take }),
    staleTime: 60_000,
  })
}

export function useApplyAmbassador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApplyPayload) => ambassadorApi.apply(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ambassadorKeys.me() })
    },
  })
}

export function useSetPayoutMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ method, details }: { method: string; details: Record<string, unknown> }) =>
      ambassadorApi.setPayoutMethod(method, details),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ambassadorKeys.me() })
      qc.invalidateQueries({ queryKey: ambassadorKeys.dashboard() })
    },
  })
}

export function useRedeemReferralCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => ambassadorApi.redeemCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ambassadorKeys.me() })
    },
  })
}

export function useValidateReferralCode(code: string, enabled = true) {
  return useQuery({
    queryKey: ambassadorKeys.validate(code),
    queryFn: () => ambassadorApi.validateCode(code),
    enabled: enabled && code.trim().length >= 3,
    staleTime: 60_000,
    retry: false,
  })
}
