import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  profilePicture: z.string().optional(),
  bio: z.string().optional(),
  primaryGoal: z.string().optional(),
})

export const updateSettingsSchema = z.object({
  locale: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().optional(),
})

export const updateWorkPreferencesSchema = z.object({
  timeZone: z.string().optional(),
  workStartHour: z.number().int().min(0).max(23).optional(),
  workEndHour: z.number().int().min(0).max(23).optional(),
  workDays: z.array(z.number().int().min(0).max(6)).optional(),
  defaultTaskDurationMinutes: z.number().int().min(5).optional(),
  maxTasksPerDay: z.number().int().min(1).optional(),
  overflowStrategy: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type UpdateWorkPreferencesInput = z.infer<typeof updateWorkPreferencesSchema>
