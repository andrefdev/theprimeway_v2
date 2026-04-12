import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  accessToken: z.string().min(1),
  idToken: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OAuthInput = z.infer<typeof oauthSchema>
