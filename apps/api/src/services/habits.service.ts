/**
 * Habits Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Stats calculations, streak computation
 * - Habit applicability / log validation
 * - NO Prisma queries, NO HTTP concerns
 */
import { habitsRepository } from '../repositories/habits.repo'
import { prisma } from '../lib/prisma'
import { validateLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'
import type { Habit, HabitLog } from '@prisma/client'

type HabitModel = Habit & { logs?: HabitLog[] }
type HabitLogModel = HabitLog

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CreateHabitInput {
  name: string
  description?: string
  category?: string
  color?: string
  targetFrequency: number
  frequencyType: string
  weekDays?: number[]
  isActive: boolean
  goalId?: string
}

export interface UpdateHabitInput {
  name?: string
  description?: string
  category?: string
  color?: string
  targetFrequency?: number
  frequencyType?: string
  weekDays?: number[]
  isActive?: boolean
  goalId?: string
}

export interface ListHabitsFilters {
  isActive?: boolean
  category?: string
  goalId?: string
  limit?: number
  offset?: number
  includeLogs?: boolean
  applicableDate?: string
}

export interface UpsertLogInput {
  date: string
  completedCount: number
  notes?: string
}

export interface HabitStatsResult {
  totalHabits: number
  totalCompletedToday: number
  completionRate: number
  streaks: {
    longest: Array<{ habitId: string; habitName: string; streakDays: number }>
    current: Array<{ habitId: string; habitName: string; currentStreak: number }>
  }
  dailyProgress: Array<{
    date: string
    totalHabits: number
    completedHabits: number
    completionRate: number
  }>
  habitDetails: Array<{
    habitId: string
    habitName: string
    completionRate: number
    currentStreak: number
    longestStreak: number
    totalCompletions: number
  }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isHabitApplicable(
  habit: { frequencyType?: string | null; weekDays?: unknown },
  dateStr: string,
): boolean {
  const d = new Date(dateStr + 'T00:00:00Z')
  const dow = d.getUTCDay()

  const ft = habit.frequencyType
  let wd = habit.weekDays

  if (!Array.isArray(wd)) {
    try {
      wd = wd ? JSON.parse(wd as string) : []
    } catch {
      wd = []
    }
  }

  if (ft === 'daily' || !ft) return true
  if (ft === 'week_days') return Array.isArray(wd) ? (wd as number[]).includes(dow) : false
  return true
}

function calculateStreaks(
  habitLogs: Record<string, any>,
  startDate: string,
  endDate: string,
  isApplicableFn: (dateStr: string) => boolean,
) {
  const start = new Date(startDate)
  const todayDate = new Date()

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Current streak: walk backwards from today
  for (let d = new Date(todayDate); d >= start; d.setDate(d.getDate() - 1)) {
    const dateStr = d.toISOString().split('T')[0]!
    if (!isApplicableFn(dateStr)) continue
    const log = habitLogs[dateStr]
    if (log && log.completedCount > 0) {
      currentStreak++
    } else {
      break
    }
  }

  // Longest streak: walk forward
  const end = new Date(endDate)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]!
    if (!isApplicableFn(dateStr)) continue
    const log = habitLogs[dateStr]
    if (log && log.completedCount > 0) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  return { currentStreak, longestStreak }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class HabitsService {
  /** List habits with optional filters, logs enrichment, and applicability filtering */
  async listHabits(
    userId: string,
    filters: ListHabitsFilters,
  ): Promise<{ data: HabitModel[]; count: number }> {
    const { habits, count } = await habitsRepository.findMany(userId, {
      isActive: filters.isActive,
      category: filters.category,
      goalId: filters.goalId,
      limit: filters.limit,
      offset: filters.offset,
    })

    let enriched = habits

    // Enrich with logs if requested
    if (filters.includeLogs && habits.length > 0) {
      const habitIds = habits.map((h) => h.id)
      const logs = await habitsRepository.findRecentLogs(habitIds, 30)

      const byHabit: Record<string, HabitLogModel[]> = {}
      logs.forEach((l) => {
        const key = l.habitId ?? ''
        if (!byHabit[key]) byHabit[key] = []
        byHabit[key]!.push(l)
      })

      enriched = habits.map((h) => ({
        ...h,
        logs: byHabit[h.id] || [],
      }))
    }

    // Filter by applicable date
    if (filters.applicableDate) {
      enriched = enriched.filter((habit) => isHabitApplicable(habit, filters.applicableDate!))
    }

    return { data: enriched, count }
  }

  /** Get a single habit, optionally with logs */
  async getHabit(
    userId: string,
    habitId: string,
    includeLogs: boolean = false,
  ): Promise<HabitModel | null> {
    const habit = await habitsRepository.findById(userId, habitId)
    if (!habit) return null

    if (includeLogs) {
      const { logs } = await habitsRepository.findLogs(habitId, userId, {
        startDate: (() => {
          const d = new Date()
          d.setDate(d.getDate() - 30)
          return d.toISOString().split('T')[0]
        })(),
        endDate: new Date().toISOString().split('T')[0],
        limit: 200,
      })
      return { ...habit, logs }
    }

    return habit
  }

  /** Create a new habit */
  async createHabit(userId: string, input: CreateHabitInput): Promise<HabitModel> {
    // Validate goalId if provided
    if (input.goalId) {
      const goal = await prisma.primeVision.findFirst({
        where: {
          OR: [
            { id: input.goalId, userId },
            { threeYearGoals: { some: { id: input.goalId, userId } } },
            { threeYearGoals: { some: { annualGoals: { some: { id: input.goalId, userId } } } } },
            { threeYearGoals: { some: { annualGoals: { some: { quarterlyGoals: { some: { id: input.goalId, userId } } } } } } },
          ],
        },
      })
      if (!goal) {
        throw new Error('Goal not found or does not belong to user')
      }
    }

    // Check habit limit
    const [subscription, usage] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
      prisma.userUsageStat.findFirst({
        where: { userId },
      }),
    ])

    const plan = subscription?.plan
    if (plan) {
      validateLimit(FEATURES.HABITS_LIMIT, plan, usage?.currentHabits ?? 0)
    }

    return habitsRepository.create(userId, {
      name: input.name,
      description: input.description,
      category: input.category,
      color: input.color,
      targetFrequency: input.targetFrequency,
      frequencyType: input.frequencyType,
      weekDays: input.weekDays || [],
      isActive: input.isActive,
      goalId: input.goalId,
    })
  }

  /** Update a habit */
  async updateHabit(
    userId: string,
    habitId: string,
    input: UpdateHabitInput,
  ): Promise<HabitModel | null> {
    // Validate goalId if provided
    if (input.goalId !== undefined) {
      if (input.goalId) {
        const goal = await prisma.primeVision.findFirst({
          where: {
            OR: [
              { id: input.goalId, userId },
              { threeYearGoals: { some: { id: input.goalId, userId } } },
              { threeYearGoals: { some: { annualGoals: { some: { id: input.goalId, userId } } } } },
              { threeYearGoals: { some: { annualGoals: { some: { quarterlyGoals: { some: { id: input.goalId, userId } } } } } } },
            ],
          },
        })
        if (!goal) {
          throw new Error('Goal not found or does not belong to user')
        }
      }
    }

    const updateData: Record<string, any> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.category !== undefined) updateData.category = input.category
    if (input.color !== undefined) updateData.color = input.color
    if (input.targetFrequency !== undefined) updateData.targetFrequency = input.targetFrequency
    if (input.frequencyType !== undefined) {
      updateData.frequencyType = input.frequencyType
      if (input.frequencyType === 'daily') {
        updateData.weekDays = []
      }
    }
    if (input.weekDays !== undefined) updateData.weekDays = input.weekDays
    if (input.isActive !== undefined) updateData.isActive = input.isActive
    if (input.goalId !== undefined) updateData.goalId = input.goalId

    return habitsRepository.update(userId, habitId, updateData)
  }

  /** Delete a habit */
  async deleteHabit(userId: string, habitId: string): Promise<boolean> {
    return habitsRepository.delete(userId, habitId)
  }

  /** Get logs for a habit */
  async getHabitLogs(
    userId: string,
    habitId: string,
    options: { startDate?: string; endDate?: string; limit?: number; offset?: number },
  ): Promise<{ data: HabitLogModel[]; count: number } | null> {
    // Verify ownership
    const habit = await habitsRepository.findHabitForValidation(habitId, userId)
    if (!habit) return null

    const { logs, count } = await habitsRepository.findLogs(habitId, userId, {
      startDate: options.startDate,
      endDate: options.endDate,
      limit: options.limit,
      offset: options.offset,
    })

    return { data: logs, count }
  }

  /** Upsert a habit log entry, with applicability validation */
  async upsertHabitLog(
    userId: string,
    habitId: string,
    input: UpsertLogInput,
  ): Promise<{ log?: HabitLogModel; error?: string; notFound?: boolean }> {
    const habit = await habitsRepository.findHabitForValidation(habitId, userId)
    if (!habit) return { notFound: true }

    // Validate applicability
    if (!isHabitApplicable(habit, input.date)) {
      return { error: 'Log date is not scheduled for this habit' }
    }

    const completionDate = new Date(input.date)
    const log = await habitsRepository.upsertLog(
      habitId,
      userId,
      completionDate,
      input.completedCount,
      input.notes,
    )

    return { log }
  }

  /** Get habit statistics */
  async getStats(
    userId: string,
    period: string = 'month',
    habitId?: string,
  ): Promise<HabitStatsResult> {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]!

    let startDate: Date
    switch (period) {
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        break
      case 'quarter':
        startDate = new Date(today)
        startDate.setMonth(today.getMonth() - 3)
        break
      case 'year':
        startDate = new Date(today)
        startDate.setFullYear(today.getFullYear() - 1)
        break
      default:
        startDate = new Date(today)
        startDate.setMonth(today.getMonth() - 1)
    }
    const startDateStr = startDate.toISOString().split('T')[0]!

    const habits = await habitsRepository.findActiveHabits(userId, habitId)

    if (!habits || habits.length === 0) {
      return {
        totalHabits: 0,
        totalCompletedToday: 0,
        completionRate: 0,
        streaks: { longest: [], current: [] },
        dailyProgress: [],
        habitDetails: [],
      }
    }

    const habitIds = habits.map((h) => h.id)
    const rawLogs = await habitsRepository.findLogsByHabitIds(habitIds, startDateStr, todayStr)
    const logs = rawLogs.map((l) => ({
      habitId: l.habitId ?? '',
      date: l.date.toISOString().split('T')[0]!,
      completedCount: l.completedCount ?? 0,
    }))

    return this.calculateHabitStats(habits, logs, startDateStr, todayStr)
  }

  // ---------------------------------------------------------------------------
  // Private: Stats calculation
  // ---------------------------------------------------------------------------
  private calculateHabitStats(
    habits: Habit[],
    logs: Array<{ habitId: string; date: string; completedCount: number }>,
    startDate: string,
    endDate: string,
  ): HabitStatsResult {
    const today = new Date().toISOString().split('T')[0]!

    const habitIsApplicable = (habit: Habit, dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00Z')
      const dow = d.getUTCDay()
      const ft = habit.frequencyType
      let wd: number[] = []

      if (Array.isArray(habit.weekDays)) {
        wd = habit.weekDays as number[]
      } else if (typeof habit.weekDays === 'string') {
        try { wd = JSON.parse(habit.weekDays) } catch { wd = [] }
      }

      if (ft === 'daily') return true
      if (ft === 'week_days') return Array.isArray(wd) ? wd.includes(dow) : false
      return true
    }

    // Group logs by habitId and date
    const logsByHabit = logs.reduce(
      (acc, log) => {
        if (!acc[log.habitId]) acc[log.habitId] = {}
        acc[log.habitId]![log.date] = log
        return acc
      },
      {} as Record<string, Record<string, (typeof logs)[number]>>,
    )

    // Calculate daily progress
    const dailyProgress: HabitStatsResult['dailyProgress'] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]!
      const applicableHabits = habits.filter((h) => habitIsApplicable(h, dateStr))
      const totalHabits = applicableHabits.length
      const completedHabits = applicableHabits.filter((habit) => {
        const log = logsByHabit[habit.id]?.[dateStr]
        return log && log.completedCount > 0
      }).length

      dailyProgress.push({
        date: dateStr,
        totalHabits,
        completedHabits,
        completionRate: totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0,
      })
    }

    // Habit details and streaks
    const habitDetails: HabitStatsResult['habitDetails'] = []
    const currentStreaks: Array<{ habitId: string; habitName: string; currentStreak: number }> = []
    const longestStreaks: Array<{ habitId: string; habitName: string; streakDays: number }> = []

    habits.forEach((habit) => {
      const habitLogs = logsByHabit[habit.id] || {}

      const totalDays = dailyProgress.filter((day) => habitIsApplicable(habit, day.date)).length
      const completedDays = dailyProgress.filter((day) => {
        if (!habitIsApplicable(habit, day.date)) return false
        const log = habitLogs[day.date]
        return log && log.completedCount > 0
      }).length

      const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

      const { currentStreak, longestStreak } = calculateStreaks(
        habitLogs,
        startDate,
        endDate,
        (dateStr: string) => habitIsApplicable(habit, dateStr),
      )

      const totalCompletions = Object.values(habitLogs).reduce(
        (sum, log) => sum + (log.completedCount || 0),
        0,
      )

      habitDetails.push({
        habitId: habit.id,
        habitName: habit.name,
        completionRate: Math.round(completionRate),
        currentStreak,
        longestStreak,
        totalCompletions,
      })

      if (currentStreak > 0) {
        currentStreaks.push({ habitId: habit.id, habitName: habit.name, currentStreak })
      }
      if (longestStreak > 0) {
        longestStreaks.push({ habitId: habit.id, habitName: habit.name, streakDays: longestStreak })
      }
    })

    currentStreaks.sort((a, b) => b.currentStreak - a.currentStreak)
    longestStreaks.sort((a, b) => b.streakDays - a.streakDays)

    const todayCompletions = habits.filter((habit) => {
      if (!habitIsApplicable(habit, today)) return false
      const log = logsByHabit[habit.id]?.[today]
      return log && log.completedCount > 0
    }).length

    const totalPossibleCompletions = dailyProgress.reduce(
      (sum, day) => sum + habits.filter((h) => habitIsApplicable(h, day.date)).length,
      0,
    )
    const totalActualCompletions = dailyProgress.reduce((sum, day) => sum + day.completedHabits, 0)
    const overallCompletionRate = totalPossibleCompletions > 0 ? (totalActualCompletions / totalPossibleCompletions) * 100 : 0

    return {
      totalHabits: habits.length,
      totalCompletedToday: todayCompletions,
      completionRate: Math.round(overallCompletionRate),
      streaks: {
        longest: longestStreaks.slice(0, 5),
        current: currentStreaks.slice(0, 5),
      },
      dailyProgress,
      habitDetails,
    }
  }

  // ---------------------------------------------------------------------------
  // AI Methods
  // ---------------------------------------------------------------------------

  /** Analyze habit patterns and provide AI insights */
  async analyzeHabit(userId: string, habitId: string) {
    const habit = await habitsRepository.findById(userId, habitId)
    if (!habit) return null

    // Fetch recent logs (last 90 days)
    const logs = await habitsRepository.findRecentLogs([habitId], 90)
    const logsByDate = logs.reduce(
      (acc, log) => {
        acc[log.date] = log
        return acc
      },
      {} as Record<string, HabitLogModel>,
    )

    // Calculate stats
    const totalDays = 90
    const completedDays = logs.filter((l) => l.completedCount > 0).length
    const completionRate = (completedDays / totalDays) * 100
    const totalCompletions = logs.reduce((sum, l) => sum + l.completedCount, 0)

    // Find streaks
    const { currentStreak, longestStreak } = calculateStreaks(habit, logsByDate)

    // Identify patterns (best days of week)
    const dayPatterns: Record<number, number> = {}
    logs.forEach((log) => {
      const date = new Date(log.date)
      const dayOfWeek = date.getDay()
      if (!dayPatterns[dayOfWeek]) dayPatterns[dayOfWeek] = 0
      dayPatterns[dayOfWeek] += log.completedCount
    })

    const bestDays = Object.entries(dayPatterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day))

    // Generate insights
    const insights = []
    if (completionRate >= 80) {
      insights.push('Excellent consistency! You\'re crushing this habit.')
    } else if (completionRate >= 60) {
      insights.push('Good progress. Keep the momentum going.')
    } else if (completionRate < 30) {
      insights.push('This habit needs attention. Consider adjusting frequency or triggers.')
    }

    if (longestStreak >= 30) {
      insights.push(`Your longest streak was ${longestStreak} days. You can do it again!`)
    }

    if (currentStreak === 0 && completionRate > 50) {
      insights.push('You\'ve broken your streak recently. Get back on track today!')
    }

    return {
      habit: { id: habit.id, name: habit.name },
      metrics: {
        completionRate: Math.round(completionRate),
        currentStreak,
        longestStreak,
        totalCompletions,
        daysTracked: completedDays,
      },
      patterns: {
        bestDaysOfWeek: bestDays,
        consistencyLevel: completionRate >= 80 ? 'excellent' : completionRate >= 60 ? 'good' : completionRate >= 40 ? 'fair' : 'poor',
      },
      insights,
    }
  }

  /** Suggest goals that would benefit from this habit */
  async suggestGoalsForHabit(userId: string, habitId: string) {
    const habit = await habitsRepository.findById(userId, habitId)
    if (!habit) return null

    // If habit already has a goal, return that
    if (habit.goalId) {
      const linkedGoal = await prisma.weeklyGoal.findUnique({
        where: { id: habit.goalId },
        select: { id: true, title: true },
      })
      if (linkedGoal) {
        return { linkedGoal, suggestions: [] }
      }
    }

    // Fetch unlinked goals at different levels
    const weeklyGoals = await prisma.weeklyGoal.findMany({
      where: { userId, isArchived: false },
      select: { id: true, title: true },
      take: 3,
    })

    const quarterlyGoals = await prisma.quarterlyGoal.findMany({
      where: { userId, isArchived: false },
      select: { id: true, title: true },
      take: 3,
    })

    const annualGoals = await prisma.annualGoal.findMany({
      where: { userId, isArchived: false },
      select: { id: true, title: true },
      take: 2,
    })

    return {
      linkedGoal: null,
      suggestions: {
        weeklyGoals: weeklyGoals.map((g) => ({ id: g.id, title: g.title, type: 'weekly' })),
        quarterlyGoals: quarterlyGoals.map((g) => ({ id: g.id, title: g.title, type: 'quarterly' })),
        annualGoals: annualGoals.map((g) => ({ id: g.id, title: g.title, type: 'annual' })),
      },
    }
  }

  /** Get optimal reminder time based on habit patterns */
  async getOptimalReminderTime(userId: string, habitId: string) {
    const habit = await habitsRepository.findById(userId, habitId)
    if (!habit) return null

    // Fetch recent logs to identify best completion times
    const logs = await habitsRepository.findRecentLogs([habitId], 30)

    // If no logs yet, suggest morning (08:00)
    if (logs.length === 0) {
      return {
        habitId,
        suggestedTime: '08:00',
        confidence: 0.5,
        reason: 'No historical data. Morning is typically optimal.',
      }
    }

    // In production, analyze actual completion timestamps from logs
    // For now, suggest based on frequency type
    const timeByFrequency: Record<string, string> = {
      daily: '08:00',
      'every_2_days': '08:00',
      'every_3_days': '08:00',
      'every_week': '19:00',
      'multiple_per_week': '18:00',
    }

    const suggestedTime = timeByFrequency[habit.frequencyType] || '08:00'

    return {
      habitId,
      suggestedTime,
      confidence: 0.7,
      reason: `Based on ${habit.frequencyType} frequency, ${suggestedTime} is typically optimal.`,
    }
  }
}

export const habitsService = new HabitsService()
