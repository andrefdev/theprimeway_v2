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

export interface ChatThreadSummary {
  id: string
  title: string | null
  lastMessageAt: string | null
  createdAt: string | null
}

export interface PersistedToolCall {
  toolCallId: string
  toolName: string
  args: unknown
  result?: unknown
}

export interface PersistedChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls: PersistedToolCall[] | null
  createdAt: string | null
}

export interface ChatThreadWithMessages {
  thread: ChatThreadSummary
  messages: PersistedChatMessage[]
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

  listThreads: () =>
    api.get<{ threads: ChatThreadSummary[] }>('/chat/threads').then((r) => r.data.threads),

  getThread: (id: string) =>
    api.get<ChatThreadWithMessages>(`/chat/threads/${id}`).then((r) => r.data),

  renameThread: (id: string, title: string) =>
    api.patch<{ ok: boolean }>(`/chat/threads/${id}`, { title }).then((r) => r.data),

  deleteThread: (id: string) =>
    api.delete<{ ok: boolean }>(`/chat/threads/${id}`).then((r) => r.data),

  deleteAllThreads: () =>
    api.delete<{ ok: boolean; deleted: number }>('/chat/threads').then((r) => r.data),
}
