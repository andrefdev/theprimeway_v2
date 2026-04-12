import { notificationsRepo } from '../repositories/notifications.repo'

interface AppNotification {
  id: string
  type: 'overdue_task' | 'habit_missed' | 'pending_transaction'
  title: string
  message: string
  href: string
  created_at: string
}

class NotificationsService {
  async registerDevice(
    userId: string,
    body: { token: string; deviceType: string; deviceName?: string },
  ) {
    const validDeviceTypes = ['web', 'android', 'ios']
    if (!body.token || !body.deviceType) {
      return { error: 'missing_fields' as const }
    }
    if (!validDeviceTypes.includes(body.deviceType)) {
      return { error: 'invalid_device_type' as const }
    }

    const device = await notificationsRepo.upsertDevice(
      body.token,
      {
        userId,
        deviceType: body.deviceType,
        deviceName: body.deviceName || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      {
        userId,
        fcmToken: body.token,
        deviceType: body.deviceType,
        deviceName: body.deviceName || null,
        isActive: true,
      },
    )

    return { data: device }
  }

  async unregisterDevice(userId: string, token: string) {
    if (!token) return { error: 'missing_token' as const }
    await notificationsRepo.deleteDevicesByToken(token, userId)
    return { success: true }
  }

  async getPreferences(userId: string) {
    return notificationsRepo.getOrCreatePreferences(userId)
  }

  async updatePreferences(userId: string, body: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {}
    if (body.habit_reminders !== undefined) updateData.habitReminders = body.habit_reminders
    if (body.pomodoro_alerts !== undefined) updateData.pomodoroAlerts = body.pomodoro_alerts
    if (body.task_reminders !== undefined) updateData.taskReminders = body.task_reminders
    if (body.daily_motivation !== undefined) updateData.dailyMotivation = body.daily_motivation
    if (body.marketing_messages !== undefined) updateData.marketingMessages = body.marketing_messages
    if (body.task_reminder_offset !== undefined) updateData.taskReminderOffset = body.task_reminder_offset
    if (body.habit_reminder_time !== undefined) updateData.habitReminderTime = body.habit_reminder_time

    return notificationsRepo.upsertPreferences(userId, updateData)
  }

  async getAggregated(userId: string): Promise<AppNotification[]> {

    const notifications: AppNotification[] = []
    const now = new Date()
    const todayNoonUTC = new Date(`${now.toISOString().split('T')[0]}T12:00:00.000Z`)
    const todayStartUTC = new Date(`${now.toISOString().split('T')[0]}T00:00:00.000Z`)
    const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)

    // 1. Overdue tasks
    const overdueTasks = await notificationsRepo.findOverdueTasks(userId, todayNoonUTC)
    for (const task of overdueTasks) {
      const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''
      notifications.push({
        id: `overdue_task_${task.id}`,
        type: 'overdue_task',
        title: task.title,
        message: dueDateStr ? `Due ${dueDateStr}` : 'Past due',
        href: '/tasks',
        created_at: task.dueDate ? task.dueDate.toISOString() : new Date().toISOString(),
      })
    }

    // 2. Active habits not logged today
    const activeHabits = await notificationsRepo.findActiveHabitsWithTodayLogs(
      userId,
      todayStartUTC,
      tomorrowStartUTC,
    )
    for (const habit of activeHabits) {
      const hasLogToday =
        habit.logs.length > 0 && habit.logs.some((l) => (l.completedCount ?? 0) > 0)

      if (!hasLogToday) {
        notifications.push({
          id: `habit_missed_${habit.id}`,
          type: 'habit_missed',
          title: habit.name,
          message: 'Not logged today',
          href: '/habits',
          created_at: new Date().toISOString(),
        })
      }
    }

    return notifications
  }

  async sendPush(body: {
    userIds?: string[]
    title: string
    body: string
    url?: string
    data?: unknown
    image?: string
    tag?: string
  }) {
    if (!body.title || !body.body) {
      return { error: 'missing_fields' as const }
    }

    const whereClause: Record<string, unknown> = { isActive: true }
    if (body.userIds && Array.isArray(body.userIds) && body.userIds.length > 0) {
      whereClause.userId = { in: body.userIds }
    }

    const devices = await notificationsRepo.findActiveDevices(whereClause)

    if (devices.length === 0) {
      return {
        message: 'No devices found',
        success_count: 0,
        failure_count: 0,
      }
    }

    return {
      message: 'Notification endpoint ready -- FCM sending requires firebase-admin integration',
      total_devices: devices.length,
      _note: 'Wire up firebase-admin sendNotification() for actual push delivery',
    }
  }
}

export const notificationsService = new NotificationsService()
