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
    const tasks = await prisma.task.findMany({
      where: { userId, kind: 'HABIT', archivedAt: null },
      select: {
        id: true,
        title: true,
        habitLogs: {
          where: { date: { gte: todayStart, lt: tomorrowStart } },
          select: { id: true, completedCount: true },
        },
      },
      take: 20,
    })
    return tasks.map((t) => ({ id: t.id, name: t.title, logs: t.habitLogs }))
  }

  async findActiveDevices(whereClause: Record<string, unknown>) {
    return prisma.userDevice.findMany({
      where: whereClause,
      select: { fcmToken: true, userId: true },
    })
  }

  // ─── Notifications (persisted inbox) ────────────────────────────────────────

  async upsertNotification(data: {
    userId: string
    type: string
    entityId: string | null
    title: string
    message: string
    href?: string | null
    urgency?: string | null
    data?: unknown
  }) {
    const entityKey = data.entityId ?? `__null__:${data.type}:${data.title}`
    const existing = await prisma.notification.findUnique({
      where: {
        user_type_entity: {
          userId: data.userId,
          type: data.type,
          entityId: entityKey,
        },
      },
      select: { id: true, dismissedAt: true },
    })
    const wasDismissed = !!existing?.dismissedAt
    const notification = await prisma.notification.upsert({
      where: {
        user_type_entity: {
          userId: data.userId,
          type: data.type,
          entityId: entityKey,
        },
      },
      update: {
        title: data.title,
        message: data.message,
        href: data.href ?? null,
        urgency: data.urgency ?? null,
        data: (data.data as import('@prisma/client').Prisma.InputJsonValue) ?? undefined,
      },
      create: {
        userId: data.userId,
        type: data.type,
        entityId: entityKey,
        title: data.title,
        message: data.message,
        href: data.href ?? null,
        urgency: data.urgency ?? null,
        data: (data.data as import('@prisma/client').Prisma.InputJsonValue) ?? undefined,
      },
    })
    return { notification, isNew: !existing, wasDismissed }
  }

  async findActiveDeviceTokensForUser(userId: string) {
    return prisma.userDevice.findMany({
      where: { userId, isActive: true },
      select: { fcmToken: true },
    })
  }

  async markDeviceInactive(fcmToken: string) {
    return prisma.userDevice.updateMany({
      where: { fcmToken },
      data: { isActive: false },
    })
  }

  async listNotifications(
    userId: string,
    opts: { includeRead?: boolean; includeDismissed?: boolean; limit: number; offset: number },
  ) {
    const where: Record<string, unknown> = { userId }
    if (!opts.includeDismissed) where.dismissedAt = null
    if (!opts.includeRead) where.readAt = null
    const [data, count, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: opts.limit,
        skip: opts.offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null, dismissedAt: null } }),
    ])
    return { data, count, unread }
  }

  async markRead(userId: string, id: string) {
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) return null
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
  }

  async dismiss(userId: string, id: string) {
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.notification.update({
      where: { id },
      data: { dismissedAt: new Date() },
    })
    return true
  }

  async dismissAll(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, dismissedAt: null },
      data: { dismissedAt: new Date() },
    })
  }

  async deleteNotification(userId: string, id: string) {
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.notification.delete({ where: { id } })
    return true
  }

  async findAllUserIds(): Promise<string[]> {
    const rows = await prisma.user.findMany({ select: { id: true } })
    return rows.map((r) => r.id)
  }

  async pruneStale(
    userId: string,
    opts: { keepTypes: string[]; keepEntityIds: string[] },
  ) {
    // Soft-dismiss any active derived notifications that no longer map to a source entity.
    return prisma.notification.updateMany({
      where: {
        userId,
        dismissedAt: null,
        type: { in: opts.keepTypes },
        entityId: { notIn: opts.keepEntityIds },
      },
      data: { dismissedAt: new Date() },
    })
  }
}

export const notificationsRepo = new NotificationsRepository()
