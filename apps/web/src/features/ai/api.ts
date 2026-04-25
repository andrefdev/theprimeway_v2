import { api } from '@/shared/lib/api-client'
import type { Briefing } from '@repo/shared/types'

interface ChatResponse {
  response: string
  toolResults?: Array<{ toolName: string; result: unknown }>
}

interface ChatMessagePayload {
  role: 'user' | 'assistant'
  content: string
}

export const aiApi = {
  sendMessage: (messages: ChatMessagePayload[], locale?: string) =>
    api.post<ChatResponse>('/chat', { messages, locale }).then((r) => r.data),

  getBriefing: () =>
    api.get<{ data: Briefing }>('/chat/briefing').then((r) => r.data),

  getWeeklyPlan: (weekStartDate: string) =>
    api.post<{ data: any }>('/chat/weekly-plan', { weekStartDate }).then((r) => r.data),
}
