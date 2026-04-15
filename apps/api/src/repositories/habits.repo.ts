/**
 * Habits Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries for habits and habit logs
 * - Returns Prisma objects directly (camelCase)
 * - NO business logic, NO HTTP concerns
 */
import { prisma } from '../lib/prisma'
import type { Prisma, Habit } from '@prisma/client'

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

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
class HabitsRepository {
  // ── Habits CRUD ────────────────────────────────────────────────────────

  async findMany(userId: string, options: FindHabitsOptions = {}) {
    const where: Prisma.HabitWhereInput = {
      userId,
      ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
      ...(options.category ? { category: options.category } : {}),
      ...(options.goalId ? { goalId: options.goalId } : {}),
    }

    const [habits, count] = await Promise.all([
      prisma.habit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      }),
      prisma.habit.count({ where }),
    ])

    // Ensure all habits have a valid color
    const habitsWithColor = habits.map(h => ({
      ...h,
      color: h.color || '#3B82F6',
    }))

    return { habits: habitsWithColor, count }
  }

  async findById(userId: string, habitId: string) {
    const habit = await prisma.habit.findUnique({ where: { id: habitId, userId } })
    if (!habit) return null
    return {
      ...habit,
      color: habit.color || '#3B82F6',
    }
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
  }) {
    const habit = await prisma.habit.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        category: data.category,
        color: data.color || '#3B82F6',
        targetFrequency: data.targetFrequency,
        frequencyType: data.frequencyType,
        weekDays: data.weekDays,
        isActive: data.isActive,
        goalId: data.goalId,
      },
    })

    return {
      ...habit,
      color: habit.color || '#3B82F6',
    }
  }

  async update(userId: string, habitId: string, data: Prisma.HabitUpdateInput) {
    const existing = await prisma.habit.findUnique({ where: { id: habitId, userId } })
    if (!existing) return null

    const updated = await prisma.habit.update({
      where: { id: habitId },
      data,
    })

    return {
      ...updated,
      color: updated.color || '#3B82F6',
    }
  }

  async delete(userId: string, habitId: string): Promise<boolean> {
    const existing = await prisma.habit.findUnique({ where: { id: habitId, userId } })
    if (!existing) return false
    await prisma.habit.delete({ where: { id: habitId } })
    return true
  }

  // ── Habit Logs ─────────────────────────────────────────────────────────

  async findLogs(
    habitId: string,
    userId: string,
    options: FindLogsOptions = {},
  ) {
    const where: Prisma.HabitLogWhereInput = { habitId, userId }

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

    return { logs, count }
  }

  async findRecentLogs(habitIds: string[], days: number = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        date: {
          gte: new Date(since.toISOString().split('T')[0]!),
          lte: new Date(new Date().toISOString().split('T')[0]!),
        },
      },
      orderBy: { date: 'asc' },
    })
  }

  async upsertLog(
    habitId: string,
    userId: string,
    date: Date,
    completedCount: number,
    notes?: string,
  ) {
    return prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, userId, date, completedCount, notes },
      update: { completedCount, notes },
    })
  }

  /** Verify habit ownership — returns minimal data for validation */
  async findHabitForValidation(
    habitId: string,
    userId: string,
  ): Promise<{ id: string; frequencyType: string | null; weekDays: unknown } | null> {
    return prisma.habit.findFirst({
      where: { id: habitId, userId },
      select: { id: true, frequencyType: true, weekDays: true },
    })
  }

  // ── Stats data ─────────────────────────────────────────────────────────

  async findActiveHabits(userId: string, habitId?: string): Promise<Habit[]> {
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        isActive: true,
        ...(habitId ? { id: habitId } : {}),
      },
    })
    return habits.map(h => ({
      ...h,
      color: h.color || '#3B82F6',
    }))
  }

  async findLogsByHabitIds(
    habitIds: string[],
    startDate: string,
    endDate: string,
  ) {
    return prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    })
  }
}

export const habitsRepository = new HabitsRepository()
