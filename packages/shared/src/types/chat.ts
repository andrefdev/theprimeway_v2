export interface ChatThread {
  id: string
  userId: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}
