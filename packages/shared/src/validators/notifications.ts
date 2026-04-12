import { z } from 'zod'

export const registerDeviceSchema = z.object({
  token: z.string().min(1),
  deviceType: z.enum(['web', 'android', 'ios']),
  deviceName: z.string().optional(),
})

export const updatePreferencesSchema = z.object({
  habit_reminders: z.boolean().optional(),
  pomodoro_alerts: z.boolean().optional(),
  task_reminders: z.boolean().optional(),
  daily_motivation: z.boolean().optional(),
  marketing_messages: z.boolean().optional(),
  task_reminder_offset: z.number().int().optional(),
  habit_reminder_time: z.string().optional(),
})

export const sendPushSchema = z.object({
  userIds: z.array(z.string()).optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  data: z.unknown().optional(),
  image: z.string().optional(),
  tag: z.string().optional(),
})

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>
export type SendPushInput = z.infer<typeof sendPushSchema>
