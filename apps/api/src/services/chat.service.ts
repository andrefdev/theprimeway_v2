import { chatRepo } from '../repositories/chat.repo'
import { prisma } from '../lib/prisma'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { calendarService } from './calendar.service'

// ---------------------------------------------------------------------------
// Rate limiter (simple in-memory)
// ---------------------------------------------------------------------------
const rateLimit = new Map<string, { count: number; lastReset: number }>()
let lastCleanup = Date.now()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 15
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanupRateLimit() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, value] of Array.from(rateLimit.entries())) {
    if (now - value.lastReset > RATE_LIMIT_WINDOW * 2) {
      rateLimit.delete(key)
    }
  }
}

class ChatService {
  checkRateLimit(userId: string): boolean {
    cleanupRateLimit()
    const now = Date.now()
    const userLimit = rateLimit.get(userId) || { count: 0, lastReset: now }

    if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
      userLimit.count = 0
      userLimit.lastReset = now
    }

    if (userLimit.count >= MAX_REQUESTS) {
      return false
    }

    userLimit.count++
    rateLimit.set(userId, userLimit)
    return true
  }

  async checkAiDataSharing(userId: string): Promise<boolean> {
    const userSettings = await chatRepo.findUserSettings(userId)
    return userSettings?.aiDataSharing ?? true
  }

  async chat(
    _userId: string,
    body: { messages?: unknown[]; model?: string; locale?: string },
  ) {
    // Simplified: return a placeholder response
    return {
      error: 'Chat streaming not yet implemented in Hono API. Use the PWA endpoint for now.',
      _meta: {
        model: body.model || 'gpt-4o',
        locale: body.locale || 'es',
        messageCount: Array.isArray(body.messages) ? body.messages.length : 0,
      },
    }
  }

  async getBriefing(userId: string) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [tasks, habits, habitLogs, transactions] = await Promise.all([
      chatRepo.findOpenTasks(userId, 10),
      chatRepo.findActiveHabits(userId),
      chatRepo.findHabitLogsByDate(userId, todayStart, todayEnd),
      chatRepo.findPendingTransactions(userId, 10),
    ])

    const completedToday = habitLogs.filter((l) => (l.completedCount ?? 0) > 0).length

    return {
      briefing: null,
      stats: {
        tasksToday: tasks.length,
        habitsCompleted: completedToday,
        totalHabits: habits.length,
        pendingTransactions: transactions.length,
      },
      _note: 'AI-generated briefing text requires OpenAI integration. Stats are live.',
    }
  }

  async getFinanceInsight(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [transactions, budgets, savingsGoals] = await Promise.all([
      chatRepo.findRecentTransactions(userId, thirtyDaysAgo, 50),
      chatRepo.findActiveBudgets(userId),
      chatRepo.findActiveSavingsGoals(userId),
    ])

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)

    return {
      insight: null,
      totalExpenses,
      totalIncome,
      activeBudgets: budgets.length,
      activeSavingsGoals: savingsGoals.length,
      _note: 'AI-generated insight text requires OpenAI integration. Financial stats are live.',
    }
  }

  async weeklyPlanning(userId: string, weekStartDate: string) {
    const weekStart = new Date(weekStartDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const [quarterlyGoals, habits, openTasks, workPreferences] = await Promise.all([
      chatRepo.findActiveGoalsByUser(userId),
      chatRepo.findActiveHabits(userId),
      chatRepo.findOpenTasks(userId, 100),
      prisma.userWorkPreferences.findFirst({ where: { userId } }),
    ])

    // Get calendar availability for the week
    const freeSlots: Record<string, { start: string; end: string; durationMinutes: number }[]> = {}
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart)
      dayDate.setDate(dayDate.getDate() + i)
      const dateStr = dayDate.toISOString().split('T')[0]!
      const result = await calendarService.getFreeSlots(userId, dateStr, 60)
      freeSlots[dayNames[i]!] = (result as any).freeSlots || []
    }

    // Prepare task context for AI
    const taskContext = openTasks
      .slice(0, 20)
      .map((t) => `- ${t.title} (priority: ${t.priority}, deadline: ${t.dueDate || 'no deadline'})`)
      .join('\n')

    const habitContext = habits
      .map((h: any) => `- ${h.name} (frequency: ${h.targetFrequency || h.frequencyType || 'daily'})`)
      .join('\n')

    const goalContext = quarterlyGoals
      .slice(0, 5)
      .map((g) => `- ${g.title} (progress: ${g.progress || 0}%)`)
      .join('\n')

    const workHours = workPreferences
      ? `${String(workPreferences.workStartHour).padStart(2, '0')}:00 - ${String(workPreferences.workEndHour).padStart(2, '0')}:00`
      : '09:00 - 17:00'

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: z.object({
        plan: z.object({
          Monday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
          Tuesday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
          Wednesday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
          Thursday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
          Friday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
          Saturday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
          Sunday: z.array(z.object({ title: z.string(), timeBlock: z.string().optional() })),
        }),
        rationale: z.string(),
      }),
      prompt: `
Create a weekly plan for ${weekStartDate} to ${weekEnd.toISOString().split('T')[0]}.

Work hours: ${workHours}

Active Goals:
${goalContext || 'No active goals'}

Daily Habits:
${habitContext || 'No habits'}

Open Tasks (prioritized):
${taskContext || 'No open tasks'}

Allocate tasks and habits across the 7 days based on:
1. Task deadlines and priorities
2. Habit frequencies and best times of day
3. Goal alignment
4. Available calendar slots

Return a coherent week plan with tasks/habits distributed by day. Include time blocks when possible.
      `,
    })

    return result
  }
}

export const chatService = new ChatService()
