import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

export interface RecurringCreate {
  templateTaskJson: Record<string, unknown>
  pattern: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY'
  daysOfWeek: number[]
  atRoughlyTime?: string
  startDate: Date
  endDate?: Date
}

class RecurringRepository {
  listByUser(userId: string) {
    return prisma.recurringSeries.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  }

  findById(id: string) {
    return prisma.recurringSeries.findUnique({ where: { id } })
  }

  create(userId: string, data: RecurringCreate) {
    const { ...rest } = data
    return prisma.recurringSeries.create({ data: { ...(rest as Prisma.RecurringSeriesUncheckedCreateInput), userId } })
  }

  async update(id: string, userId: string, data: Partial<RecurringCreate>) {
    const r = await prisma.recurringSeries.updateMany({ where: { id, userId }, data: data as any })
    if (r.count === 0) return null
    return prisma.recurringSeries.findUnique({ where: { id } })
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const r = await prisma.recurringSeries.deleteMany({ where: { id, userId } })
    return r.count > 0
  }

  // Used by materializer — active series on a reference date
  findActiveForDate(userId: string, ref: Date) {
    return prisma.recurringSeries.findMany({
      where: {
        userId,
        startDate: { lte: ref },
        OR: [{ endDate: null }, { endDate: { gte: ref } }],
      },
    })
  }

  findExistingInstance(userId: string, seriesId: string, day: Date) {
    return prisma.task.findFirst({
      where: { userId, recurringSeriesId: seriesId, day },
      select: { id: true },
    })
  }

  async createTaskFromTemplate(
    userId: string,
    seriesId: string,
    day: Date,
    template: Record<string, any>,
  ) {
    return prisma.task.create({
      data: {
        userId,
        recurringSeriesId: seriesId,
        day,
        title: template.title ?? 'Recurring task',
        description: template.description ?? null,
        estimatedDurationMinutes: template.estimatedDurationMinutes ?? template.plannedTimeMinutes ?? null,
        plannedTimeMinutes: template.plannedTimeMinutes ?? null,
        channelId: template.channelId ?? null,
        kind: (template.kind as 'TASK' | 'HABIT') ?? 'TASK',
        identityStatement: template.identityStatement ?? null,
        tags: template.tags ?? [],
        priority: template.priority ?? 'medium',
        status: 'open',
        isRecurring: true,
        habitMeta: template.habitMeta ?? undefined,
      },
    })
  }
}

export const recurringRepo = new RecurringRepository()
