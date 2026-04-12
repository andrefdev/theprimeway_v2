import { z } from 'zod'

export const chatMessageSchema = z.object({
  messages: z.array(z.unknown()).optional(),
  model: z.string().optional(),
  locale: z.string().optional(),
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>
