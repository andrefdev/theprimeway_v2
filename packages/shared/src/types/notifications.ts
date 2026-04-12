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
