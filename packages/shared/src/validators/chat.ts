import { z } from 'zod'

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
  locale: z.string().optional(),
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>
