import { api } from '@/shared/lib/api-client'
import type { LoginInput, RegisterInput, OAuthInput } from '@repo/shared/validators'

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    emailVerified: string | null
    role: string
  }
}

export interface VerificationPendingResponse {
  requiresVerification: true
  email: string
}

export type LoginResponse = AuthResponse | VerificationPendingResponse

export function isVerificationPending(
  r: LoginResponse | AuthResponse,
): r is VerificationPendingResponse {
  return (r as VerificationPendingResponse).requiresVerification === true
}

export interface MeResponse {
  user: AuthResponse['user'] & {
    settings: {
      timezone: string | null
      theme: string | null
      locale: string | null
      baseCurrency: string | null
    } | null
  }
}

export const authApi = {
  login: (data: LoginInput) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterInput) =>
    api.post<VerificationPendingResponse>('/auth/register', data).then((r) => r.data),

  oauth: (data: OAuthInput) =>
    api.post<AuthResponse>('/auth/oauth', data).then((r) => r.data),

  me: () =>
    api.get<MeResponse>('/auth/me').then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () =>
    api.delete('/auth/logout'),

  verifyEmail: (email: string, code: string) =>
    api.post<AuthResponse>('/auth/verify-email', { email, code }).then((r) => r.data),

  resendOtp: (email: string, purpose: 'register' | 'reset') =>
    api.post<{ ok: true }>('/auth/resend-otp', { email, purpose }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ ok: true }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (email: string, code: string, password: string) =>
    api.post<{ ok: true }>('/auth/reset-password', { email, code, password }).then((r) => r.data),
}
