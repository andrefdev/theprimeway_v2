import { prisma } from '../lib/prisma'

class NotificationsRepository {
  async upsertDevice(
    fcmToken: string,
    updateData: {
      userId: string
      deviceType: string
      deviceName: string | null
      isActive: boolean
      lastUsedAt: Date
    },
    createData: {
      userId: string
      fcmToken: string
      deviceType: string
      deviceName: string | null
      isActive: boolean
    },
  ) {
    return prisma.userDevice.upsert({
      where: { fcmToken },
      update: updateData,
      create: createData,
    })
  }

  async deleteDevicesByToken(fcmToken: string, userId: string) {
    return prisma.userDevice.deleteMany({ where: { fcmToken, userId } })
  }

  async upsertPreferences(userId: string, updateData: Record<string, unknown>) {
    return prisma.notificationPreferences.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData } as any,
    })
  }

  async getOrCreatePreferences(userId: string) {
    return prisma.notificationPreferences.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
  }

  async findOverdueTasks(userId: string, before: Date) {
    return prisma.task.findMany({
      where: {
        userId,
        status: 'open',
        dueDate: { lt: before },
        archivedAt: null,
      },
      select: { id: true, title: true, dueDate: true, priority: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    })
  }

  async findActiveHabitsWithTodayLogs(userId: string, todayStart: Date, tomorrowStart: Date) {
    return prisma.habit.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        logs: {
          where: { date: { gte: todayStart, lt: tomorrowStart } },
          select: { id: true, completedCount: true },
        },
      },
      take: 20,
    })
  }

  async findActiveDevices(whereClause: Record<string, unknown>) {
    return prisma.userDevice.findMany({
      where: whereClause,
      select: { fcmToken: true, userId: true },
    })
  }
}

export const notificationsRepo = new NotificationsRepository()
