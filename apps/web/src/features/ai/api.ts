import { api } from '@/shared/lib/api-client'

interface ChatResponse {
  response: string
  toolResults?: Array<{ toolName: string; result: unknown }>
}

interface ChatMessagePayload {
  role: 'user' | 'assistant'
  content: string
}

export interface WeeklyPlanDay {
  title: string
  timeBlock?: string
}

export interface WeeklyPlan {
  plan: Record<string, WeeklyPlanDay[]>
  rationale: string
}

export const aiApi = {
  sendMessage: (messages: ChatMessagePayload[], locale?: string) =>
    api.post<ChatResponse>('/chat', { messages, locale }).then((r) => r.data),

  getWeeklyPlan: (weekStartDate: string) =>
    api
      .post<{ data: WeeklyPlan } | WeeklyPlan>('/chat/weekly-plan', { weekStartDate })
      .then((r) => {
        const body = r.data as { data: WeeklyPlan } | WeeklyPlan
        return 'data' in body ? body.data : body
      }),
}
