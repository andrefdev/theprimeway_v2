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
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  oauth: (data: OAuthInput) =>
    api.post<AuthResponse>('/auth/oauth', data).then((r) => r.data),

  me: () =>
    api.get<MeResponse>('/auth/me').then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () =>
    api.delete('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean }>('/auth/reset-password', { token, password }).then((r) => r.data),
}
