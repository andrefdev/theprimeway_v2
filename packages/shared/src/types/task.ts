export type TaskStatus = 'open' | 'completed' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  userId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  scheduledDate: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
  estimatedDuration: number | null
  completedAt: string | null
  isArchived: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}
