import { prisma } from '../lib/prisma'

class CronRepository {
  async findUsersWithDailyMotivation() {
    return prisma.user.findMany({
      where: {
        notificationPreferences: { dailyMotivation: true },
      },
      include: { settings: true },
    })
  }

  async findActiveDevicesByUserIds(userIds: string[]) {
    return prisma.userDevice.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: { fcmToken: true },
    })
  }

  async findUsersWithTaskReminders() {
    return prisma.user.findMany({
      where: {
        notificationPreferences: { taskReminders: true },
        devices: { some: { isActive: true } },
      },
      include: {
        notificationPreferences: true,
        settings: true,
      },
    })
  }

  async findTasksForReminder(userId: string, windowStart: Date, windowEnd: Date) {
    return prisma.task.findMany({
      where: {
        userId,
        status: 'open',
        archivedAt: null,
        lastReminderSentAt: null,
        OR: [
          { dueDate: { gt: windowStart, lte: windowEnd } },
          { scheduledStart: { gt: windowStart, lte: windowEnd } },
        ],
      },
      select: { id: true, title: true, dueDate: true, scheduledStart: true },
    })
  }

  async findActiveDevicesByUserId(userId: string) {
    return prisma.userDevice.findMany({
      where: { userId, isActive: true },
      select: { fcmToken: true },
    })
  }

  async markTaskReminded(taskId: string) {
    return prisma.task.update({
      where: { id: taskId },
      data: { lastReminderSentAt: new Date() },
    })
  }

  async findUsersWithHabitReminders() {
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences: { habitReminders: true },
        tasks: { some: { kind: 'HABIT', archivedAt: null } },
        devices: { some: { isActive: true } },
      },
      include: {
        notificationPreferences: true,
        settings: true,
        tasks: { where: { kind: 'HABIT', archivedAt: null } },
      },
    })
    // Legacy shape: expose .habits adapted from task{kind:HABIT}
    return users.map((u) => ({
      ...u,
      habits: u.tasks.map((t: any) => {
        const m = (t.habitMeta ?? {}) as any
        return {
          id: t.id,
          name: t.title,
          targetFrequency: typeof m.targetFrequency === 'number' ? m.targetFrequency : 1,
          frequencyType: m.frequencyType ?? null,
          weekDays: m.weekDays ?? [],
          isActive: true,
        }
      }),
    }))
  }

  async findHabitLogsByUserAndDate(userId: string, todayStart: Date, todayEnd: Date) {
    return prisma.habitLog.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
    })
  }
}

export const cronRepo = new CronRepository()
