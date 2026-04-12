/**
 * Tasks Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries (findMany, create, update, delete)
 * - Returns Prisma objects directly (camelCase)
 * - Date normalization
 * - NO business logic, NO HTTP concerns
 */
import { prisma } from '../lib/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FindTasksOptions {
  status?: string
  priority?: string
  scheduledDate?: { gte?: Date; lte?: Date }
  archivedAt?: null | { not: null }
  weeklyGoalId?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Normalize a date string to midnight UTC to prevent timezone day-boundary shifts */
export function normalizeScheduledDate(dateStr: string): Date {
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  return new Date(`${datePart}T00:00:00.000Z`)
}

const defaultInclude = { weeklyGoal: true }
const defaultOrderBy = [
  { scheduledStart: 'asc' as const },
  { orderInDay: 'asc' as const },
  { createdAt: 'desc' as const },
]

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
class TasksRepository {
  async findMany(userId: string, options: FindTasksOptions = {}) {
    const where: any = { userId }
    if (options.status) where.status = options.status
    if (options.priority) where.priority = options.priority
    if (options.scheduledDate) where.scheduledDate = options.scheduledDate
    if (options.archivedAt !== undefined) where.archivedAt = options.archivedAt
    if (options.weeklyGoalId) where.weeklyGoalId = options.weeklyGoalId

    return prisma.task.findMany({
      where,
      include: defaultInclude,
      orderBy: defaultOrderBy,
      take: options.limit ?? 200,
      skip: options.offset ?? 0,
    })
  }

  async findTodaysTasks(userId: string, todayISO: string) {
    const dayStart = new Date(`${todayISO}T00:00:00.000Z`)
    const dayEnd = new Date(`${todayISO}T23:59:59.999Z`)
    return prisma.task.findMany({
      where: {
        userId,
        scheduledDate: { gte: dayStart, lte: dayEnd },
        status: 'open',
        archivedAt: null,
      },
      include: defaultInclude,
      orderBy: defaultOrderBy,
    })
  }

  async findBacklogTasks(userId: string) {
    return prisma.task.findMany({
      where: { userId, scheduledDate: null, status: 'open', archivedAt: null },
      include: defaultInclude,
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  async findArchivedTasks(userId: string) {
    return prisma.task.findMany({
      where: { userId, archivedAt: { not: null } },
      include: defaultInclude,
      orderBy: [{ archivedAt: 'desc' }],
    })
  }

  async findWeekTasks(userId: string, weekStartISO: string, weekEndISO: string) {
    const start = new Date(`${weekStartISO}T00:00:00.000Z`)
    const end = new Date(`${weekEndISO}T23:59:59.999Z`)
    return prisma.task.findMany({
      where: {
        userId,
        archivedAt: null,
        OR: [
          { scheduledDate: { gte: start, lte: end } },
          { scheduledDate: null, status: 'open' },
        ],
      },
      include: defaultInclude,
      orderBy: defaultOrderBy,
    })
  }

  async findById(userId: string, taskId: string) {
    return prisma.task.findFirst({
      where: { id: taskId, userId },
      include: defaultInclude,
    })
  }

  async create(userId: string, data: Record<string, any>) {
    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        status: data.status || 'open',
        priority: data.priority || 'medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        scheduledDate: data.scheduledDate ? normalizeScheduledDate(data.scheduledDate) : undefined,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        isAllDay: data.isAllDay,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        backlogState: data.backlogState,
        source: data.source,
        tags: data.tags || [],
        weeklyGoalId: data.weeklyGoalId,
      },
      include: defaultInclude,
    })
  }

  async update(userId: string, taskId: string, data: Record<string, any>) {
    const existing = await prisma.task.findFirst({ where: { id: taskId, userId } })
    if (!existing) return null

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate ? normalizeScheduledDate(data.scheduledDate) : null
    if (data.scheduledStart !== undefined) updateData.scheduledStart = data.scheduledStart ? new Date(data.scheduledStart) : null
    if (data.scheduledEnd !== undefined) updateData.scheduledEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : null
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay
    if (data.estimatedDurationMinutes !== undefined) updateData.estimatedDurationMinutes = data.estimatedDurationMinutes
    if (data.backlogState !== undefined) updateData.backlogState = data.backlogState
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.weeklyGoalId !== undefined) updateData.weeklyGoalId = data.weeklyGoalId || null
    if (data.archivedAt !== undefined) updateData.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null
    if (data.orderInDay !== undefined) updateData.orderInDay = data.orderInDay

    // Auto-set completedAt
    if (data.status === 'completed' && !existing.completedAt) {
      updateData.completedAt = new Date()
    } else if (data.status === 'open') {
      updateData.completedAt = null
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: defaultInclude,
    })
  }

  async delete(userId: string, taskId: string): Promise<boolean> {
    const existing = await prisma.task.findFirst({ where: { id: taskId, userId } })
    if (!existing) return false
    await prisma.task.delete({ where: { id: taskId } })
    return true
  }

  async archivePastTasks(userId: string, referenceDate: string): Promise<number> {
    const dayEnd = new Date(`${referenceDate}T00:00:00.000Z`)
    const result = await prisma.task.updateMany({
      where: {
        userId,
        status: 'open',
        archivedAt: null,
        scheduledDate: { lt: dayEnd },
      },
      data: { archivedAt: new Date() },
    })
    return result.count
  }

  async count(userId: string, where?: Record<string, any>): Promise<number> {
    return prisma.task.count({ where: { userId, ...where } })
  }
}

export const tasksRepository = new TasksRepository()
