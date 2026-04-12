import { prisma } from '../lib/prisma'

class PomodoroRepository {
  async findManySessions(
    where: Record<string, unknown>,
    opts: { limit: number; offset: number },
  ) {
    return prisma.pomodoroSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: opts.limit,
      skip: opts.offset,
      include: { task: { select: { id: true, title: true } } },
    })
  }

  async countSessions(where: Record<string, unknown>) {
    return prisma.pomodoroSession.count({ where })
  }

  async createSession(data: {
    userId: string
    sessionType: string
    plannedDuration: number
    taskId: string | null
    startedAt: Date
    isCompleted: boolean
  }) {
    const { userId, taskId, ...rest } = data
    return prisma.pomodoroSession.create({
      data: {
        ...rest,
        user: { connect: { id: userId } },
        ...(taskId ? { task: { connect: { id: taskId } } } : {}),
      },
    })
  }

  async findSessionByIdAndUser(id: string, userId: string) {
    return prisma.pomodoroSession.findFirst({
      where: { id, userId },
      include: { task: { select: { id: true, title: true } } },
    })
  }

  async findSessionOwnership(id: string, userId: string) {
    return prisma.pomodoroSession.findFirst({ where: { id, userId } })
  }

  async updateSession(id: string, data: Record<string, unknown>) {
    return prisma.pomodoroSession.update({ where: { id }, data })
  }

  async deleteSession(id: string) {
    return prisma.pomodoroSession.delete({ where: { id } })
  }

  async createXpEvent(data: {
    userId: string
    source: string
    sourceId: string
    amount: number
    earnedDate: string
    metadata: Record<string, unknown>
  }) {
    return prisma.xpEvent.create({ data: data as any })
  }

  async countCompletedFocus(userId: string) {
    return prisma.pomodoroSession.count({
      where: { userId, isCompleted: true, sessionType: 'focus' },
    })
  }

  async sumFocusMinutes(userId: string) {
    return prisma.pomodoroSession.aggregate({
      where: { userId, isCompleted: true, sessionType: 'focus' },
      _sum: { plannedDuration: true },
    })
  }

  async countCompletedFocusInRange(userId: string, gte: Date, lte?: Date) {
    const where: Record<string, unknown> = {
      userId,
      isCompleted: true,
      sessionType: 'focus',
      startedAt: lte ? { gte, lte } : { gte },
    }
    return prisma.pomodoroSession.count({ where })
  }
}

export const pomodoroRepo = new PomodoroRepository()
