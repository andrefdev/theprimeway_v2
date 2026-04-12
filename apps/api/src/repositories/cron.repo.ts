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
    return prisma.user.findMany({
      where: {
        notificationPreferences: { habitReminders: true },
        habits: { some: { isActive: true } },
        devices: { some: { isActive: true } },
      },
      include: {
        notificationPreferences: true,
        settings: true,
        habits: { where: { isActive: true } },
      },
    })
  }

  async findHabitLogsByUserAndDate(userId: string, todayStart: Date, todayEnd: Date) {
    return prisma.habitLog.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
    })
  }
}

export const cronRepo = new CronRepository()
