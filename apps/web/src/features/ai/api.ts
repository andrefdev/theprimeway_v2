import { api } from '@/shared/lib/api-client'
import type { Briefing } from '@repo/shared/types'

interface ChatResponse {
  reply: string
  threadId?: string
}

interface ChatMessagePayload {
  role: 'user' | 'assistant'
  content: string
}

export const aiApi = {
  sendMessage: (messages: ChatMessagePayload[], locale?: string) =>
    api.post<{ data: ChatResponse }>('/chat', { messages, locale }).then((r) => r.data),

  getBriefing: () =>
    api.get<{ data: Briefing }>('/chat/briefing').then((r) => r.data),

  getFinanceInsight: () =>
    api.get<{ data: { insight: string } }>('/chat/finance-insight').then((r) => r.data),
}
