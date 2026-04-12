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

export interface Briefing {
  tasksToday: number
  tasksCompleted: number
  habitsToday: number
  habitsCompleted: number
  upcomingEvents: number
  streak: number
  summary: string | null
}
