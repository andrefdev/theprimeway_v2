import { z } from 'zod'

export const chatMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
  locale: z.string().optional(),
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>

export const threadRenameSchema = z.object({
  title: z.string().min(1).max(100),
})

export type ThreadRenameInput = z.infer<typeof threadRenameSchema>
