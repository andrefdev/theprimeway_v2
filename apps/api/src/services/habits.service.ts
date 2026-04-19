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
import { gamificationService } from './gamification.service'
import { prisma } from '../lib/prisma'
import { validateLimit } from '../lib/limits'
import { FEATURES, CATEGORY_TO_PILLAR } from '@repo/shared/constants'
import { generateObject } from 'ai'
import { taskModel } from '../lib/ai-models'
import { z } from 'zod'
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
    const habitValidation = await habitsRepository.findHabitForValidation(habitId, userId)
    if (!habitValidation) return { notFound: true }

    // Validate applicability
    if (!isHabitApplicable(habitValidation, input.date)) {
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

    // Auto-award XP and check streak if completed
    if (input.completedCount > 0) {
      // Fetch full habit for metadata
      const habit = await habitsRepository.findById(userId, habitId)
      const xpAmount = habit?.goalId ? 25 : 10
      await gamificationService.awardXp(userId, {
        source: 'habit',
        sourceId: habitId,
        amount: xpAmount,
        earnedDate: completionDate.toISOString().split('T')[0]!,
        metadata: { habitName: habit?.name || 'Habit' },
      })

      // Auto-check-in streak
      await gamificationService.checkInStreak(userId, input.date)
    }

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

    const logs = await habitsRepository.findRecentLogs([habitId], 90)
    const totalDays = 90

    if (logs.length === 0) {
      return {
        habit: { id: habit.id, name: habit.name },
        metrics: {
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
          daysTracked: 0,
        },
        patterns: {
          bestDaysOfWeek: [] as number[],
          consistencyLevel: 'poor' as const,
        },
        insights: [] as string[],
      }
    }

    const logsByDate = logs.reduce(
      (acc, log) => {
        const dateStr = log.date instanceof Date ? log.date.toISOString().split('T')[0]! : log.date
        if (dateStr) acc[dateStr] = log
        return acc
      },
      {} as Record<string, HabitLogModel>,
    )

    const completedDays = logs.filter((l) => (l.completedCount ?? 0) > 0).length
    const completionRate = (completedDays / totalDays) * 100
    const totalCompletions = logs.reduce((sum, l) => sum + (l.completedCount ?? 0), 0)

    const endDate = new Date().toISOString().split('T')[0]!
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    const startDateStr = startDate.toISOString().split('T')[0]!

    const { currentStreak, longestStreak } = calculateStreaks(
      logsByDate,
      startDateStr,
      endDate,
      (dateStr: string) => isHabitApplicable(habit, dateStr),
    )

    const dayPatterns: Record<number, number> = {}
    logs.forEach((log) => {
      const date = new Date(log.date)
      if (isNaN(date.getTime())) return
      const dayOfWeek = date.getDay()
      if (!dayPatterns[dayOfWeek]) dayPatterns[dayOfWeek] = 0
      dayPatterns[dayOfWeek] += log.completedCount ?? 0
    })

    const bestDays = Object.entries(dayPatterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day))

    const insights: string[] = []
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
    const [weeklyGoals, quarterlyGoals, annualGoals] = await Promise.all([
      prisma.weeklyGoal.findMany({
        where: { userId },
        select: { id: true, title: true, description: true },
        take: 10,
      }),
      prisma.quarterlyGoal.findMany({
        where: { userId },
        select: { id: true, title: true },
        take: 5,
      }),
      prisma.annualGoal.findMany({
        where: { userId },
        select: { id: true, title: true },
        take: 3,
      }),
    ])

    // Get habit statistics for context
    const logs = await habitsRepository.findRecentLogs([habitId], 30)
    const completionRate = logs.length > 0
      ? (logs.filter((l) => (l.completedCount ?? 0) > 0).length / 30) * 100
      : 0

    // Use AI to suggest relevant goals
    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        suggestedGoalIds: z.array(z.string()).describe('IDs of suggested goals that align with this habit'),
        reasoning: z.string().describe('Brief explanation of why these goals align with the habit'),
      }),
      prompt: `
You are a goal-setting assistant. Based on the following habit and existing goals, suggest which goals this habit would directly support.

HABIT:
- Name: ${habit.name}
- Description: ${habit.description || 'No description'}
- Category: ${habit.category || 'Uncategorized'}
- Frequency: ${habit.frequencyType} (target: ${habit.targetFrequency}x)
- Completion Rate (last 30 days): ${Math.round(completionRate)}%

AVAILABLE GOALS:

Weekly Goals:
${weeklyGoals.map((g) => `- [${g.id}] ${g.title}: ${g.description || 'No description'}`).join('\n')}

Quarterly Goals:
${quarterlyGoals.map((g) => `- [${g.id}] ${g.title}`).join('\n')}

Annual Goals:
${annualGoals.map((g) => `- [${g.id}] ${g.title}`).join('\n')}

Based on the habit's characteristics, suggest up to 3 goal IDs that would be directly supported or enhanced by completing this habit consistently.
Return only the goal IDs that make strong logical connections to the habit.
      `,
    })

    // Filter goals to only include suggested ones and reformat
    const suggestedIds = result.object.suggestedGoalIds
    return {
      linkedGoal: null,
      suggestions: {
        weeklyGoals: weeklyGoals
          .filter((g) => suggestedIds.includes(g.id))
          .map((g) => ({ id: g.id, title: g.title, type: 'weekly' })),
        quarterlyGoals: quarterlyGoals
          .filter((g) => suggestedIds.includes(g.id))
          .map((g) => ({ id: g.id, title: g.title, type: 'quarterly' })),
        annualGoals: annualGoals
          .filter((g) => suggestedIds.includes(g.id))
          .map((g) => ({ id: g.id, title: g.title, type: 'annual' })),
      },
      reasoning: result.object.reasoning,
    }
  }

  /** Get optimal reminder time based on habit patterns */
  async getOptimalReminderTime(userId: string, habitId: string) {
    const habit = await habitsRepository.findById(userId, habitId)
    if (!habit) return null

    // Fetch recent logs with timestamps (next 30 days of schedule)
    const logs = await habitsRepository.findRecentLogs([habitId], 30)

    // If no logs, use AI to suggest based on habit type
    if (logs.length === 0) {
      const result = await generateObject({
        model: taskModel,
        schema: z.object({
          hour: z.number().min(0).max(23),
          minute: z.number().min(0).max(59),
          reason: z.string(),
        }),
        prompt: `
Suggest the optimal reminder time (HH:MM format) for the following habit:
- Name: ${habit.name}
- Frequency: ${habit.frequencyType}
- Category: ${habit.category || 'General'}
- Description: ${habit.description || 'No description'}

Consider typical patterns for ${habit.frequencyType} habits. Return the hour (0-23) and minute (0-59) for the best reminder time.
        `,
      })

      const suggestedTime = `${String(result.object.hour).padStart(2, '0')}:${String(result.object.minute).padStart(2, '0')}`
      return {
        habitId,
        suggestedTime,
        confidence: 0.6,
        reason: result.object.reason,
      }
    }

    // Analyze actual completion times if available
    // Most habits tracked at date level, but use frequency pattern + AI for optimization
    const completedDays = logs.filter((l) => (l.completedCount ?? 0) > 0).length
    const completionRate = (completedDays / 30) * 100

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        hour: z.number().min(0).max(23),
        minute: z.number().min(0).max(59),
        reason: z.string(),
      }),
      prompt: `
Optimize the reminder time for this habit based on its characteristics and performance:

HABIT:
- Name: ${habit.name}
- Frequency: ${habit.frequencyType}
- Completion Rate (last 30 days): ${Math.round(completionRate)}%
- Category: ${habit.category || 'General'}

Based on the ${habit.frequencyType} schedule and ${Math.round(completionRate)}% completion rate, suggest the optimal reminder time.
If completion rate is low, suggest an earlier morning time. If high, consider their current pattern.
Return the hour (0-23) and minute (0-59).
      `,
    })

    const suggestedTime = `${String(result.object.hour).padStart(2, '0')}:${String(result.object.minute).padStart(2, '0')}`
    const confidence = Math.min(0.5 + (completionRate / 100) * 0.4, 0.95)

    return {
      habitId,
      suggestedTime,
      confidence: Math.round(confidence * 100) / 100,
      reason: result.object.reason,
    }
  }

  /** Suggest new habits based on user's active goals */
  async suggestHabitsForGoals(userId: string): Promise<{ suggestions: Array<{ name: string; description: string; frequency: string; targetFrequency: number; goalTitle: string; goalId: string }> }> {
    // Get user's active goals
    const [threeYearGoals, annualGoals, quarterlyGoals] = await Promise.all([
      prisma.threeYearGoal.findMany({ where: { userId }, select: { id: true, title: true }, take: 5 }),
      prisma.annualGoal.findMany({ where: { userId }, select: { id: true, title: true }, take: 5 }),
      prisma.quarterlyGoal.findMany({ where: { userId }, select: { id: true, title: true }, take: 5 }),
    ])

    // Get existing habits to avoid duplicates
    const existingHabits = await habitsRepository.findActiveHabits(userId)
    const existingNames = existingHabits.map(h => h.name.toLowerCase())

    const goalsList = [
      ...threeYearGoals.map(g => `[3Y|${g.id}] ${g.title}`),
      ...annualGoals.map(g => `[1Y|${g.id}] ${g.title}`),
      ...quarterlyGoals.map(g => `[Q|${g.id}] ${g.title}`),
    ].join('\n')

    if (!goalsList) return { suggestions: [] }

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        suggestions: z.array(z.object({
          name: z.string().describe('Habit name, concise'),
          description: z.string().describe('Why this habit helps the goal'),
          frequency: z.enum(['daily', 'week_days', 'times_per_week']),
          targetFrequency: z.number().int().min(1).max(7),
          goalId: z.string().describe('ID of the goal this habit supports'),
          goalTitle: z.string().describe('Title of the goal'),
        })),
      }),
      prompt: `
You are a habit-building coach. Suggest 3-5 NEW habits that would directly support the user's goals.

EXISTING HABITS (do NOT suggest duplicates):
${existingNames.join(', ') || '(none)'}

USER'S GOALS:
${goalsList}

For each suggestion:
- Name should be specific and actionable (e.g., "Read 20 pages" not "Read more")
- Frequency should be realistic
- Link to the most relevant goal using its exact ID
- Description explains the connection between habit and goal
      `,
    })

    return result.object
  }

  /** Suggest habit stacking based on completion patterns */
  async suggestHabitStacking(userId: string): Promise<{ stacks: Array<{ anchor: string; anchorId: string; newHabit: string; reason: string }> }> {
    const habits = await habitsRepository.findActiveHabits(userId)
    if (habits.length < 2) return { stacks: [] }

    const habitIds = habits.map(h => h.id)
    const logs = await habitsRepository.findRecentLogs(habitIds, 30)

    // Calculate completion rates per habit
    const completionByHabit: Record<string, { name: string; rate: number }> = {}
    for (const habit of habits) {
      const habitLogs = logs.filter(l => l.habitId === habit.id)
      const completed = habitLogs.filter(l => (l.completedCount ?? 0) > 0).length
      completionByHabit[habit.id] = {
        name: habit.name,
        rate: Math.round((completed / 30) * 100),
      }
    }

    const habitsList = habits.map(h =>
      `- [${h.id}] "${h.name}" (${h.frequencyType}, completion: ${completionByHabit[h.id]?.rate || 0}%)`
    ).join('\n')

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        stacks: z.array(z.object({
          anchorId: z.string().describe('ID of the anchor habit (high completion rate)'),
          anchor: z.string().describe('Name of the anchor habit'),
          newHabit: z.string().describe('Suggested habit to stack after the anchor'),
          reason: z.string().describe('Why this stack works'),
        })),
      }),
      prompt: `
You are a habit stacking expert. Based on the user's habit data, suggest "habit stacks" — pairing a new small habit right after an existing strong habit (anchor).

Rules:
- Anchor habits should have >60% completion rate (they're reliable triggers)
- Suggested new habits should be small (2-10 minutes)
- The stack should feel natural (e.g., "After morning coffee, journal for 5 min")
- Suggest 2-4 stacks maximum

USER'S HABITS:
${habitsList}

For each stack, use the exact anchor habit ID from the list.
      `,
    })

    return result.object
  }

  /** Analyze correlations between habits and productivity metrics */
  async analyzeCorrelations(userId: string) {
    const habits = await habitsRepository.findActiveHabits(userId)
    if (habits.length < 2) {
      return { correlations: [], summary: 'Need at least 2 active habits with history to find patterns.' }
    }

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const habitIds = habits.map((h: any) => h.id)
    const logs = await habitsRepository.findRecentLogs(habitIds, 60)

    // Get task completions by day
    const tasks = await prisma.task.findMany({
      where: { userId, status: 'completed', completedAt: { gte: sixtyDaysAgo } },
      select: { completedAt: true },
    })

    // Get pomodoro sessions by day
    const pomodoros = await prisma.pomodoroSession.findMany({
      where: { userId, isCompleted: true, createdAt: { gte: sixtyDaysAgo } },
      select: { createdAt: true },
    })

    // Build daily summary
    const dailyData: Record<string, { habits: string[]; taskCount: number; pomodoroCount: number }> = {}

    for (const log of logs) {
      const dateStr = (log as any).date instanceof Date
        ? (log as any).date.toISOString().split('T')[0]!
        : String((log as any).date)
      if (!dailyData[dateStr]) dailyData[dateStr] = { habits: [], taskCount: 0, pomodoroCount: 0 }
      if ((log as any).completedCount > 0) {
        const habit = habits.find((h: any) => h.id === (log as any).habitId)
        if (habit) dailyData[dateStr]!.habits.push((habit as any).name)
      }
    }

    for (const task of tasks) {
      if (!task.completedAt) continue
      const dateStr = task.completedAt.toISOString().split('T')[0]!
      if (!dailyData[dateStr]) dailyData[dateStr] = { habits: [], taskCount: 0, pomodoroCount: 0 }
      dailyData[dateStr]!.taskCount++
    }

    for (const pomo of pomodoros) {
      if (!pomo.createdAt) continue
      const dateStr = pomo.createdAt.toISOString().split('T')[0]!
      if (!dailyData[dateStr]) dailyData[dateStr] = { habits: [], taskCount: 0, pomodoroCount: 0 }
      dailyData[dateStr]!.pomodoroCount++
    }

    const summaryText = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, d]) => `${date}: habits=[${d.habits.join(',')}] tasks=${d.taskCount} pomodoros=${d.pomodoroCount}`)
      .join('\n')

    if (!summaryText) {
      return { correlations: [], summary: 'Not enough data to analyze correlations yet.' }
    }

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        correlations: z.array(z.object({
          pattern: z.string().describe('Description of the correlation pattern'),
          strength: z.enum(['strong', 'moderate', 'weak']),
          habitNames: z.array(z.string()),
          insight: z.string().describe('Actionable insight for the user'),
        })),
        summary: z.string().describe('Overall summary of habit-productivity patterns'),
      }),
      prompt: `Analyze this 30-day habit and productivity data to find correlations between habit completion and productivity output.

DATA (format: date: habits=[completed habits] tasks=completed_tasks pomodoros=completed_pomodoros):
${summaryText}

Find patterns like:
- Habits that correlate with higher task completion
- Habit combinations that boost productivity
- Days without certain habits showing lower output
- Pomodoro session patterns tied to specific habits

Return 2-5 correlations ordered by strength. Be specific about the data patterns you observe.`,
    })

    return result.object
  }

  // ---------------------------------------------------------------------------
  // Streak Protection — escalating reminders for at-risk streaks
  // ---------------------------------------------------------------------------

  /** Urgency level for a streak-at-risk habit */
  static readonly STREAK_URGENCY = {
    NONE: 'none',
    GENTLE: 'gentle',
    URGENT: 'urgent',
    CRITICAL: 'critical',
    MINIMAL: 'minimal',
  } as const

  /**
   * For each active habit with an ongoing streak, determine if the streak is
   * at risk and return a progressively urgent reminder payload.
   *
   * Urgency rules (UTC midnight cutoff):
   *  - `none`     — already logged today
   *  - `gentle`   — >6 h remaining, streak > 3 days
   *  - `urgent`   — 2-6 h remaining, streak > 7 days
   *  - `critical` — <2 h remaining, streak > 0
   *  - `minimal`  — <2 h remaining, offer a "just 1 rep" fallback
   */
  async getStreakProtectionStatus(userId: string) {
    const todayStr = new Date().toISOString().split('T')[0]!

    // 1. Fetch all active habits
    const { habits } = await habitsRepository.findMany(userId, {
      isActive: true,
      limit: 200,
    })

    if (habits.length === 0) return []

    // 2. Fetch today's logs for all habits in one query
    const habitIds = habits.map((h) => h.id)
    const todayDate = new Date(todayStr + 'T00:00:00Z')

    const todayLogs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        date: todayDate,
      },
    })

    const logsByHabit = new Map(todayLogs.map((l) => [l.habitId, l]))

    // 3. Fetch recent logs (last 60 days) to compute current streaks
    const recentLogs = await habitsRepository.findRecentLogs(habitIds, 60)

    // Group logs by habitId -> { dateStr: log }
    const logMapByHabit: Record<string, Record<string, { completedCount: number | null }>> = {}
    for (const log of recentLogs) {
      const hid = log.habitId ?? ''
      if (!logMapByHabit[hid]) logMapByHabit[hid] = {}
      const dateStr = log.date instanceof Date
        ? log.date.toISOString().split('T')[0]!
        : String(log.date).split('T')[0]!
      logMapByHabit[hid]![dateStr] = log
    }

    // 4. Hours remaining until UTC midnight
    const now = new Date()
    const endOfDayUTC = new Date(todayStr + 'T23:59:59.999Z')
    const hoursRemaining = Math.max(
      0,
      (endOfDayUTC.getTime() - now.getTime()) / (1000 * 60 * 60),
    )

    // 5. Build per-habit protection status
    type Urgency = 'none' | 'gentle' | 'urgent' | 'critical' | 'minimal'
    const results: Array<{
      habitId: string
      habitName: string
      currentStreak: number
      urgency: Urgency
      hoursRemaining: number
      message: string
    }> = []

    for (const habit of habits) {
      // Check applicability — skip habits not scheduled for today
      if (!isHabitApplicable(habit, todayStr)) continue

      // Compute current streak from logs (walking backwards from yesterday)
      const habitLogs = logMapByHabit[habit.id] ?? {}
      const streakStart = new Date()
      streakStart.setDate(streakStart.getDate() - 59)
      const { currentStreak } = calculateStreaks(
        habitLogs,
        streakStart.toISOString().split('T')[0]!,
        todayStr,
        (d) => isHabitApplicable(habit, d),
      )

      if (currentStreak === 0) continue

      // Check if already logged today
      const todayLog = logsByHabit.get(habit.id)
      const loggedToday = todayLog && (todayLog.completedCount ?? 0) > 0

      let urgency: Urgency
      let message: string

      if (loggedToday) {
        urgency = 'none'
        message = `${habit.name} is on track — ${currentStreak}-day streak safe.`
      } else if (hoursRemaining < 2 && currentStreak > 0) {
        // Under 2 hours: critical + minimal offer
        urgency = 'minimal'
        message = `Only ${Math.round(hoursRemaining * 60)} minutes left! Do a minimal version of ${habit.name} to save your ${currentStreak}-day streak.`
      } else if (hoursRemaining < 2) {
        urgency = 'critical'
        message = `${habit.name}: ${currentStreak}-day streak expires soon! Less than 2 hours remaining.`
      } else if (hoursRemaining <= 6 && currentStreak > 7) {
        urgency = 'urgent'
        message = `${habit.name}: your ${currentStreak}-day streak is at risk — only ${Math.round(hoursRemaining)} hours left today.`
      } else if (hoursRemaining > 6 && currentStreak > 3) {
        urgency = 'gentle'
        message = `Friendly reminder: keep your ${currentStreak}-day ${habit.name} streak going today.`
      } else {
        // Streak exists but doesn't meet any escalation threshold yet
        continue
      }

      results.push({
        habitId: habit.id,
        habitName: habit.name,
        currentStreak,
        urgency,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        message,
      })
    }

    // Sort by urgency severity: minimal > critical > urgent > gentle > none
    const urgencyOrder: Record<Urgency, number> = {
      minimal: 0,
      critical: 1,
      urgent: 2,
      gentle: 3,
      none: 4,
    }
    results.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

    return results
  }

  // ---------------------------------------------------------------------------
  // Migration: old categories -> life pillars
  // ---------------------------------------------------------------------------

  /**
   * Migrate habits from the legacy 8-category system to the 6 life pillars.
   * Safe to run multiple times — only updates rows whose category matches an old value.
   */
  async migrateCategoryToPillars(userId: string): Promise<{ migrated: number }> {
    let count = 0
    for (const [oldCat, newPillar] of Object.entries(CATEGORY_TO_PILLAR)) {
      const result = await prisma.habit.updateMany({
        where: { userId, category: oldCat },
        data: { category: newPillar },
      })
      count += result.count
    }
    return { migrated: count }
  }
}

export const habitsService = new HabitsService()
