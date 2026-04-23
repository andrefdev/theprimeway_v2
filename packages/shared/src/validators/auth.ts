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

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export const resendOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['register', 'reset']),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OAuthInput = z.infer<typeof oauthSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResendOtpInput = z.infer<typeof resendOtpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
