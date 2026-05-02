import axios from 'axios'
import { useAuthStore } from '@/features/auth/store'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type AmbassadorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export interface AmbassadorTier {
  id: string
  name: string
  order: number
  minActiveReferrals: number
  commissionPct: number | string
  perks: string[]
  badgeColor: string | null
}

export interface Ambassador {
  id: string
  userId: string
  status: AmbassadorStatus
  rejectionReason: string | null
  fullName: string
  contactPhone: string | null
  country: string
  primaryPlatform: string
  primaryHandle: string
  audienceSize: number | null
  niche: string | null
  motivation: string
  promoChannels: string[]
  sampleUrls: string[]
  socialLinks: Record<string, string> | null
  payoutMethod: string | null
  payoutDetails: Record<string, unknown> | null
  referralCode: string | null
  tierId: string | null
  tier: AmbassadorTier | null
  customCommissionPct: number | string | null
  appliedAt: string
  reviewedAt: string | null
  approvedAt: string | null
  user: { id: string; email: string; name: string | null }
  _count?: { referrals: number; commissions?: number }
}

export interface AmbassadorDetail extends Ambassador {
  referrals: Array<{
    id: string
    status: string
    createdAt: string
    firstPaidAt: string | null
    referredUser: { id: string; email: string; name: string | null }
  }>
  payouts: Array<{
    id: string
    amountCents: number
    method: string
    externalRef: string | null
    notes: string | null
    paidAt: string
  }>
}

export const ambassadorsApi = {
  list: async (params: { status?: string; tierId?: string; search?: string; skip?: number; take?: number } = {}) => {
    const { data } = await api.get<{ data: Ambassador[] }>('/admin/ambassadors', { params })
    return data.data
  },

  get: async (id: string) => {
    const { data } = await api.get<{ data: AmbassadorDetail }>(`/admin/ambassadors/${id}`)
    return data.data
  },

  approve: async (id: string) => {
    const { data } = await api.post<{ data: Ambassador }>(`/admin/ambassadors/${id}/approve`)
    return data.data
  },

  reject: async (id: string, reason: string) => {
    const { data } = await api.post<{ data: Ambassador }>(`/admin/ambassadors/${id}/reject`, { reason })
    return data.data
  },

  setTier: async (id: string, tierId: string) => {
    const { data } = await api.patch<{ data: Ambassador }>(`/admin/ambassadors/${id}/tier`, { tierId })
    return data.data
  },

  setCommission: async (id: string, commissionPct: number | null) => {
    const { data } = await api.patch<{ data: Ambassador }>(`/admin/ambassadors/${id}/commission`, { commissionPct })
    return data.data
  },

  suspend: async (id: string) => {
    const { data } = await api.post<{ data: Ambassador }>(`/admin/ambassadors/${id}/suspend`)
    return data.data
  },

  owed: async (id: string) => {
    const { data } = await api.get<{ data: { amountCents: number; commissionsCount: number } }>(
      `/admin/ambassadors/${id}/payouts/owed`,
    )
    return data.data
  },

  registerPayout: async (
    id: string,
    payload: { amountCents: number; method: string; externalRef?: string; notes?: string },
  ) => {
    const { data } = await api.post<{ data: any }>(`/admin/ambassadors/${id}/payouts`, payload)
    return data.data
  },

  listTiers: async () => {
    const { data } = await api.get<{ data: AmbassadorTier[] }>('/admin/ambassador-tiers')
    return data.data
  },

  updateTier: async (
    id: string,
    patch: { name?: string; minActiveReferrals?: number; commissionPct?: number; perks?: string[]; badgeColor?: string },
  ) => {
    const { data } = await api.patch<{ data: AmbassadorTier }>(`/admin/ambassador-tiers/${id}`, patch)
    return data.data
  },
}
