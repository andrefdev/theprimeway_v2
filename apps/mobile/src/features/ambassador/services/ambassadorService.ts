import { apiClient } from '@shared/api/client'

export interface ValidateCodeResponse {
  valid: boolean
  data: { ambassadorId: string; ambassadorName: string; tier: string | null } | null
}

export interface AmbassadorMe {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  referralCode: string | null
  fullName: string
}

export const ambassadorService = {
  me: async (): Promise<AmbassadorMe | null> => {
    const r = await apiClient.get<{ data: AmbassadorMe | null }>('/ambassador/me')
    return r.data.data
  },

  validateCode: async (code: string): Promise<ValidateCodeResponse> => {
    const r = await apiClient.get<ValidateCodeResponse>(`/referral/validate/${encodeURIComponent(code)}`)
    return r.data
  },

  redeemCode: async (code: string): Promise<{ ok: boolean; ambassadorName: string }> => {
    const r = await apiClient.post<{ data: { ok: boolean; ambassadorName: string } }>('/ambassador/referral/redeem', { code })
    return r.data.data
  },
}
