/**
 * Habits Repository — translation layer over Task{kind: HABIT}.
 *
 * Mapping:
 *   Habit.id              ↔ Task.id
 *   Habit.name            ↔ Task.title
 *   Habit.description     ↔ Task.description
 *   Habit.category/color/targetFrequency/frequencyType/weekDays → Task.habitMeta (Json)
 *   Habit.isActive        ↔ Task.archivedAt (null=active)
 *   Habit.goalId          ↔ first TaskGoal link (any horizon)
 *
 * HabitLog remains a dedicated table; `task_id` now FKs Task.id.
 */
import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FindHabitsOptions {
  isActive?: boolean
  category?: string
  goalId?: string
  limit?: number
  offset?: number
}

export interface FindLogsOptions {
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface HabitDTO {
  id: string
  userId: string | null
  name: string
  description: string | null
  category: string | null
  color: string
  targetFrequency: number
  frequencyType: string | null
  weekDays: unknown
  isActive: boolean
  goalId: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------
function readMeta(task: any): { category: string | null; color: string; targetFrequency: number; frequencyType: string | null; weekDays: unknown } {
  const m = (task.habitMeta ?? {}) as any
  return {
    category: m.category ?? null,
    color: m.color || '#3B82F6',
    targetFrequency: typeof m.targetFrequency === 'number' ? m.targetFrequency : 1,
    frequencyType: m.frequencyType ?? null,
    weekDays: m.weekDays ?? [],
  }
}

function taskToHabit(task: any, goalId: string | null = null): HabitDTO {
  const meta = readMeta(task)
  return {
    id: task.id,
    userId: task.userId ?? null,
    name: task.title,
    description: task.description ?? null,
    category: meta.category,
    color: meta.color,
    targetFrequency: meta.targetFrequency,
    frequencyType: meta.frequencyType,
    weekDays: meta.weekDays,
    isActive: task.archivedAt == null,
    goalId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

async function resolveGoalIds(taskIds: string[]): Promise<Map<string, string>> {
  if (taskIds.length === 0) return new Map()
  const links = await prisma.taskGoal.findMany({ where: { taskId: { in: taskIds } } })
  const map = new Map<string, string>()
  for (const l of links) {
    if (!map.has(l.taskId)) map.set(l.taskId, l.goalId)
  }
  return map
}

async function syncGoalLink(taskId: string, goalId: string | null | undefined) {
  if (goalId === undefined) return
  await prisma.taskGoal.deleteMany({ where: { taskId } })
  if (goalId) await prisma.taskGoal.create({ data: { taskId, goalId } })
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
class HabitsRepository {
  async findMany(userId: string, options: FindHabitsOptions = {}) {
    const where: Prisma.TaskWhereInput = {
      userId,
      kind: 'HABIT',
      ...(options.isActive === true ? { archivedAt: null } : {}),
      ...(options.isActive === false ? { archivedAt: { not: null } } : {}),
      ...(options.goalId ? { goalLinks: { some: { goalId: options.goalId } } } : {}),
    }

    const [tasks, count] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
        include: { goalLinks: { take: 1 } },
      }),
      prisma.task.count({ where }),
    ])

    let habits = tasks.map((t: any) => taskToHabit(t, t.goalLinks?.[0]?.goalId ?? null))
    if (options.category) habits = habits.filter((h: HabitDTO) => h.category === options.category)
    return { habits, count }
  }

  async findById(userId: string, habitId: string): Promise<HabitDTO | null> {
    const task = await prisma.task.findFirst({
      where: { id: habitId, userId, kind: 'HABIT' },
      include: { goalLinks: { take: 1 } },
    })
    if (!task) return null
    return taskToHabit(task, (task as any).goalLinks?.[0]?.goalId ?? null)
  }

  async create(userId: string, data: {
    name: string
    description?: string
    category?: string
    color?: string
    targetFrequency: number
    frequencyType: string
    weekDays: number[]
    isActive: boolean
    goalId?: string
  }): Promise<HabitDTO> {
    const task = await prisma.task.create({
      data: {
        userId,
        kind: 'HABIT',
        title: data.name,
        description: data.description,
        tags: [],
        archivedAt: data.isActive ? null : new Date(),
        habitMeta: {
          category: data.category ?? null,
          color: data.color || '#3B82F6',
          targetFrequency: data.targetFrequency,
          frequencyType: data.frequencyType,
          weekDays: data.weekDays,
        } as Prisma.InputJsonValue,
      },
    })
    if (data.goalId) await syncGoalLink(task.id, data.goalId)
    return taskToHabit(task, data.goalId ?? null)
  }

  async update(userId: string, habitId: string, data: Record<string, any>): Promise<HabitDTO | null> {
    const existing = await prisma.task.findFirst({ where: { id: habitId, userId, kind: 'HABIT' } })
    if (!existing) return null

    const curMeta = (existing.habitMeta ?? {}) as any
    const meta = { ...curMeta }
    if (data.category !== undefined) meta.category = data.category
    if (data.color !== undefined) meta.color = data.color
    if (data.targetFrequency !== undefined) meta.targetFrequency = data.targetFrequency
    if (data.frequencyType !== undefined) meta.frequencyType = data.frequencyType
    if (data.weekDays !== undefined) meta.weekDays = data.weekDays

    const updateData: Prisma.TaskUpdateInput = { habitMeta: meta as Prisma.InputJsonValue }
    if (data.name !== undefined) updateData.title = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.archivedAt = data.isActive ? null : new Date()

    const updated = await prisma.task.update({ where: { id: habitId }, data: updateData })
    if (data.goalId !== undefined) await syncGoalLink(habitId, data.goalId || null)

    const goalId = data.goalId !== undefined
      ? (data.goalId || null)
      : (await prisma.taskGoal.findFirst({ where: { taskId: habitId }, select: { goalId: true } }))?.goalId ?? null
    return taskToHabit(updated, goalId)
  }

  async delete(userId: string, habitId: string): Promise<boolean> {
    const existing = await prisma.task.findFirst({ where: { id: habitId, userId, kind: 'HABIT' } })
    if (!existing) return false
    await prisma.task.delete({ where: { id: habitId } })
    return true
  }

  // ── Habit Logs ─────────────────────────────────────────────────────────

  async findLogs(habitId: string, userId: string, options: FindLogsOptions = {}) {
    const where: Prisma.HabitLogWhereInput = { taskId: habitId, userId }
    if (options.startDate || options.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (options.startDate) dateFilter.gte = new Date(options.startDate)
      if (options.endDate) dateFilter.lte = new Date(options.endDate)
      where.date = dateFilter
    }
    const [logs, count] = await Promise.all([
      prisma.habitLog.findMany({
        where,
        orderBy: { date: 'desc' },
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      }),
      prisma.habitLog.count({ where }),
    ])
    return { logs: logs.map((l: any) => ({ ...l, habitId: l.taskId })), count }
  }

  async findRecentLogs(habitIds: string[], days: number = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const logs = await prisma.habitLog.findMany({
      where: {
        taskId: { in: habitIds },
        date: {
          gte: new Date(since.toISOString().split('T')[0]!),
          lte: new Date(new Date().toISOString().split('T')[0]!),
        },
      },
      orderBy: { date: 'asc' },
    })
    return logs.map((l: any) => ({ ...l, habitId: l.taskId }))
  }

  async upsertLog(habitId: string, userId: string, date: Date, completedCount: number, notes?: string) {
    const log = await prisma.habitLog.upsert({
      where: { taskId_date: { taskId: habitId, date } },
      create: { taskId: habitId, userId, date, completedCount, notes },
      update: { completedCount, notes },
    })
    return { ...log, habitId: log.taskId }
  }

  async findHabitForValidation(habitId: string, userId: string): Promise<{ id: string; frequencyType: string | null; weekDays: unknown } | null> {
    const task = await prisma.task.findFirst({
      where: { id: habitId, userId, kind: 'HABIT' },
      select: { id: true, habitMeta: true },
    })
    if (!task) return null
    const meta = readMeta(task)
    return { id: task.id, frequencyType: meta.frequencyType, weekDays: meta.weekDays }
  }

  async findActiveHabits(userId: string, habitId?: string): Promise<HabitDTO[]> {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        kind: 'HABIT',
        archivedAt: null,
        ...(habitId ? { id: habitId } : {}),
      },
      include: { goalLinks: { take: 1 } },
    })
    return tasks.map((t: any) => taskToHabit(t, t.goalLinks?.[0]?.goalId ?? null))
  }

  async findLogsByHabitIds(habitIds: string[], startDate: string, endDate: string) {
    const logs = await prisma.habitLog.findMany({
      where: {
        taskId: { in: habitIds },
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      orderBy: { date: 'asc' },
    })
    return logs.map((l: any) => ({ ...l, habitId: l.taskId }))
  }
}

export const habitsRepository = new HabitsRepository()

// Re-export for backward compatibility
export { resolveGoalIds }
