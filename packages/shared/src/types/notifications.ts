export interface NotificationPreferences {
  id: string
  userId: string
  habitReminders: boolean
  pomodoroAlerts: boolean
  taskReminders: boolean
  dailyMotivation: boolean
  marketingMessages: boolean
  taskReminderOffset: number
  habitReminderTime: string | null
}

export interface PushSubscription {
  id: string
  userId: string
  token: string
  deviceType: 'web' | 'android' | 'ios'
  deviceName: string | null
  isActive: boolean
  createdAt: string
}

export interface AppNotification {
  id: string
  type: 'overdue_task' | 'habit_missed' | 'pending_transaction'
  title: string
  message: string
  href: string
  created_at: string
}

export interface SmartReminder {
  habitId: string
  habitName: string
  urgency: 'high' | 'medium' | 'low'
  message: string
  streakAtRisk: boolean
  calendarBusy: boolean
}

export interface BatchedNotification {
  type: 'batch_tasks' | 'batch_habits' | 'batch_transactions' | 'smart_reminder'
  title: string
  message: string
  count: number
  items: Array<{ id: string; title: string; href: string }>
  urgency?: 'high' | 'medium' | 'low'
}

export interface BatchedNotificationsResponse {
  batched: BatchedNotification[]
  totalCount: number
}
