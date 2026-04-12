import { z } from 'zod'

export const updateCalendarSchema = z.object({
  isSelectedForSync: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  color: z.string().optional(),
})

export const googleCallbackSchema = z.object({
  code: z.string().min(1),
})

export const syncCalendarSchema = z.object({
  calendarId: z.string().optional(),
  calendar_id: z.string().optional(),
})

export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>
export type GoogleCallbackInput = z.infer<typeof googleCallbackSchema>
export type SyncCalendarInput = z.infer<typeof syncCalendarSchema>
