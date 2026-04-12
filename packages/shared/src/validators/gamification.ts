import { z } from 'zod'

export const updateGamificationSettingsSchema = z.object({
  dailyGoal: z.number().int().min(1).optional(),
  title: z.string().optional(),
})

export const awardXpSchema = z.object({
  source: z.string().min(1),
  sourceId: z.string().optional(),
  amount: z.number().int().min(1),
  earnedDate: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const streakCheckInSchema = z.object({
  date: z.string().optional(),
})

export const challengeProgressSchema = z.object({
  challengeId: z.string().min(1).optional(),
  challenge_id: z.string().min(1).optional(),
  increment: z.number().int().min(1).default(1),
})

export type UpdateGamificationSettingsInput = z.infer<typeof updateGamificationSettingsSchema>
export type AwardXpInput = z.infer<typeof awardXpSchema>
export type StreakCheckInInput = z.infer<typeof streakCheckInSchema>
export type ChallengeProgressInput = z.infer<typeof challengeProgressSchema>
