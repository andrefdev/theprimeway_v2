import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

export interface SessionCreate {
  taskId?: string
  kind?: 'WORK' | 'POMODORO' | 'BREAK' | 'HABIT_LOG'
  start: Date
  end: Date
  externalCalendarId?: string
  externalEventId?: string
  createdBy?: 'USER' | 'AUTO_SCHEDULE' | 'AUTO_RESCHEDULE' | 'SPLIT' | 'IMPORT'
}

class WorkingSessionsRepository {
  findMany(userId: string, filters: { from?: Date; to?: Date; taskId?: string }) {
    const where: Prisma.WorkingSessionWhereInput = { userId }
    if (filters.taskId) where.taskId = filters.taskId
    if (filters.from || filters.to) {
      where.start = {}
      if (filters.from) (where.start as any).gte = filters.from
      if (filters.to) (where.start as any).lte = filters.to
    }
    return prisma.workingSession.findMany({
      where,
      include: { task: true },
      orderBy: { start: 'asc' },
    })
  }

  create(userId: string, data: SessionCreate) {
    return prisma.workingSession.create({
      data: { userId, ...data, kind: data.kind ?? 'WORK' },
    })
  }

  findByIdAndUser(id: string, userId: string) {
    return prisma.workingSession.findFirst({ where: { id, userId } })
  }

  findById(id: string) {
    return prisma.workingSession.findUnique({ where: { id } })
  }

  async update(id: string, userId: string, data: Partial<SessionCreate>) {
    const r = await prisma.workingSession.updateMany({ where: { id, userId }, data })
    return r.count > 0
  }

  async delete(id: string) {
    await prisma.workingSession.delete({ where: { id } })
  }
}

export const workingSessionsRepo = new WorkingSessionsRepository()
