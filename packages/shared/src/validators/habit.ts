import { z } from 'zod'

export const createHabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  targetFrequency: z.number().int().min(1).default(1),
  frequencyType: z.enum(['daily', 'week_days', 'times_per_week']).default('daily'),
  weekDays: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().optional().default(true),
  goalId: z.string().optional(),
})

export const updateHabitSchema = createHabitSchema.partial()

export const upsertHabitLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  completedCount: z.number().int().min(0),
  notes: z.string().optional(),
})

export type CreateHabitInput = z.input<typeof createHabitSchema>
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>
export type UpsertHabitLogInput = z.infer<typeof upsertHabitLogSchema>
