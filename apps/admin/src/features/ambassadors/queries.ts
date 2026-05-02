import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ambassadorsApi } from './api'

export const ambassadorsQueryKeys = {
  all: ['ambassadors'] as const,
  list: (params: Record<string, unknown>) => ['ambassadors', 'list', params] as const,
  detail: (id: string) => ['ambassadors', 'detail', id] as const,
  owed: (id: string) => ['ambassadors', 'owed', id] as const,
  tiers: () => ['ambassador-tiers'] as const,
}

export function useAmbassadors(params: { status?: string; tierId?: string; search?: string; skip?: number; take?: number } = {}) {
  return useQuery({
    queryKey: ambassadorsQueryKeys.list(params),
    queryFn: () => ambassadorsApi.list(params),
  })
}

export function useAmbassadorDetail(id: string) {
  return useQuery({
    queryKey: ambassadorsQueryKeys.detail(id),
    queryFn: () => ambassadorsApi.get(id),
    enabled: !!id,
  })
}

export function useAmbassadorOwed(id: string) {
  return useQuery({
    queryKey: ambassadorsQueryKeys.owed(id),
    queryFn: () => ambassadorsApi.owed(id),
    enabled: !!id,
  })
}

export function useAmbassadorTiers() {
  return useQuery({
    queryKey: ambassadorsQueryKeys.tiers(),
    queryFn: () => ambassadorsApi.listTiers(),
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: ambassadorsQueryKeys.all })
  if (id) qc.invalidateQueries({ queryKey: ambassadorsQueryKeys.detail(id) })
}

export function useApproveAmbassador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ambassadorsApi.approve(id),
    onSuccess: (_d, id) => invalidate(qc, id),
  })
}

export function useRejectAmbassador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ambassadorsApi.reject(id, reason),
    onSuccess: (_d, { id }) => invalidate(qc, id),
  })
}

export function useSetAmbassadorTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tierId }: { id: string; tierId: string }) => ambassadorsApi.setTier(id, tierId),
    onSuccess: (_d, { id }) => invalidate(qc, id),
  })
}

export function useSetAmbassadorCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, commissionPct }: { id: string; commissionPct: number | null }) =>
      ambassadorsApi.setCommission(id, commissionPct),
    onSuccess: (_d, { id }) => invalidate(qc, id),
  })
}

export function useSuspendAmbassador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ambassadorsApi.suspend(id),
    onSuccess: (_d, id) => invalidate(qc, id),
  })
}

export function useRegisterPayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amountCents,
      method,
      externalRef,
      notes,
    }: {
      id: string
      amountCents: number
      method: string
      externalRef?: string
      notes?: string
    }) => ambassadorsApi.registerPayout(id, { amountCents, method, externalRef, notes }),
    onSuccess: (_d, { id }) => {
      invalidate(qc, id)
      qc.invalidateQueries({ queryKey: ambassadorsQueryKeys.owed(id) })
    },
  })
}

export function useUpdateTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { name?: string; minActiveReferrals?: number; commissionPct?: number; perks?: string[]; badgeColor?: string }
    }) => ambassadorsApi.updateTier(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ambassadorsQueryKeys.tiers() }),
  })
}
