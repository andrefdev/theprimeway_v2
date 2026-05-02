import { api } from '@/shared/lib/api-client'

export type AmbassadorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
export type AmbassadorPlatform = 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK' | 'TWITTER' | 'NEWSLETTER' | 'BLOG' | 'PODCAST' | 'LINKEDIN' | 'OTHER'

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
  primaryPlatform: AmbassadorPlatform
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
}

export interface ApplyPayload {
  fullName: string
  contactPhone?: string | null
  country: string
  primaryPlatform: AmbassadorPlatform
  primaryHandle: string
  audienceSize?: number | null
  niche?: string | null
  motivation: string
  promoChannels: string[]
  sampleUrls: string[]
  socialLinks?: Record<string, string> | null
  agreedToTerms: boolean
}

export interface AmbassadorDashboard {
  status: AmbassadorStatus
  referralCode: string | null
  referralLink: string
  tier: AmbassadorTier | null
  nextTier: AmbassadorTier | null
  effectiveCommissionPct: number
  totals: {
    totalReferrals: number
    activeReferrals: number
    accruedCents: number
    paidCents: number
    owedCents: number
  }
  recentReferrals: Array<{
    id: string
    status: string
    createdAt: string
    firstPaidAt: string | null
    nameInitial: string
  }>
}

export interface Referral {
  id: string
  status: string
  createdAt: string
  firstPaidAt: string | null
  churnedAt: string | null
  referredUser: { name: string | null; createdAt: string }
}

export interface Commission {
  id: string
  periodMonth: string
  grossAmountCents: number
  commissionPct: number | string
  amountCents: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CLAWED_BACK'
  createdAt: string
}

export interface ValidateCodeResponse {
  valid: boolean
  data: { ambassadorId: string; ambassadorName: string; tier: string | null } | null
}

export const ambassadorApi = {
  me: () => api.get<{ data: Ambassador | null }>('/ambassador/me').then((r) => r.data.data),

  apply: (payload: ApplyPayload) =>
    api.post<{ data: Ambassador }>('/ambassador/apply', payload).then((r) => r.data.data),

  dashboard: () => api.get<{ data: AmbassadorDashboard }>('/ambassador/dashboard').then((r) => r.data.data),

  referrals: (params: { skip?: number; take?: number } = {}) =>
    api.get<{ data: Referral[] }>('/ambassador/referrals', { params }).then((r) => r.data.data),

  commissions: (params: { skip?: number; take?: number } = {}) =>
    api.get<{ data: Commission[] }>('/ambassador/commissions', { params }).then((r) => r.data.data),

  setPayoutMethod: (method: string, details: Record<string, unknown>) =>
    api.patch<{ data: Ambassador }>('/ambassador/payout-method', { method, details }).then((r) => r.data.data),

  validateCode: (code: string) =>
    api.get<ValidateCodeResponse>(`/referral/validate/${encodeURIComponent(code)}`).then((r) => r.data),

  redeemCode: (code: string) =>
    api.post<{ data: { ok: boolean; ambassadorName: string } }>('/ambassador/referral/redeem', { code }).then((r) => r.data.data),
}
