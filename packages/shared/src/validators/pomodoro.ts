import { z } from 'zod'

export const createPomodoroSessionSchema = z.object({
  sessionType: z.enum(['focus', 'short_break', 'long_break']).default('focus'),
  durationMinutes: z.number().int().min(1).max(120).default(25),
  taskId: z.string().optional(),
  startedAt: z.string().optional(),
})

export const updatePomodoroSessionSchema = z.object({
  isCompleted: z.boolean().optional(),
  actualDuration: z.number().int().min(0).optional(),
  endedAt: z.string().optional(),
  notes: z.string().optional(),
})

export type CreatePomodoroSessionInput = z.infer<typeof createPomodoroSessionSchema>
export type UpdatePomodoroSessionInput = z.infer<typeof updatePomodoroSessionSchema>
