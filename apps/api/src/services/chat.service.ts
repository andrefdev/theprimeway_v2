import { chatRepo } from '../repositories/chat.repo'
import { prisma } from '../lib/prisma'
import { generateObject, generateText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { calendarService } from './calendar.service'
import { tasksRepository } from '../repositories/tasks.repo'

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
    userId: string,
    body: { messages: { role: 'user' | 'assistant'; content: string }[]; locale?: string },
  ) {
    const locale = body.locale || 'en'

    // Fetch user context for the system prompt
    const [openTasks, activeHabits] = await Promise.all([
      chatRepo.findOpenTasks(userId, 20),
      chatRepo.findActiveHabits(userId),
    ])

    const taskContext = openTasks
      .map((t) => `- [${t.id}] "${t.title}" (priority: ${t.priority}, due: ${t.dueDate || 'none'})`)
      .join('\n')

    const habitContext = activeHabits
      .map((h: any) => `- [${h.id}] "${h.name}" (frequency: ${h.frequencyType || 'daily'}, target: ${h.targetFrequency || 1})`)
      .join('\n')

    const systemPrompt = `You are a productivity assistant for ThePrimeWay, a personal productivity app.
You help the user manage their tasks and habits. Be concise, actionable, and encouraging.
Respond in ${locale === 'es' ? 'Spanish' : 'English'}.

Current date: ${new Date().toISOString().split('T')[0]}

User's open tasks:
${taskContext || '(no open tasks)'}

User's active habits:
${habitContext || '(no active habits)'}

When the user asks you to create, complete, or list tasks or habits, use the available tools.
After using a tool, summarize what you did in your response.
Do NOT invent task or habit IDs — only reference IDs from the context above or from tool results.`

    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: body.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      tools: {
        createTask: tool({
          description: 'Create a new task for the user',
          parameters: z.object({
            title: z.string().describe('Task title'),
            description: z.string().optional().describe('Task description'),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Task priority'),
            dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
            scheduledDate: z.string().optional().describe('Scheduled date in YYYY-MM-DD format'),
          }),
          execute: async ({ title, description, priority, dueDate, scheduledDate }) => {
            const task = await tasksRepository.create(userId, {
              title,
              description,
              priority: priority || 'medium',
              dueDate,
              scheduledDate,
            })
            return { success: true, task: { id: task.id, title: task.title, status: task.status } }
          },
        }),

        completeTask: tool({
          description: 'Mark an existing task as completed',
          parameters: z.object({
            taskId: z.string().describe('The ID of the task to complete'),
          }),
          execute: async ({ taskId }) => {
            const task = await tasksRepository.update(userId, taskId, { status: 'completed' })
            if (!task) return { success: false, error: 'Task not found' }
            return { success: true, task: { id: task.id, title: task.title, status: task.status } }
          },
        }),

        listTasks: tool({
          description: 'List the user\'s open tasks',
          parameters: z.object({
            limit: z.number().optional().describe('Max number of tasks to return (default 10)'),
          }),
          execute: async ({ limit }) => {
            const tasks = await chatRepo.findOpenTasks(userId, limit || 10)
            return {
              tasks: tasks.map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                dueDate: t.dueDate,
                status: t.status,
              })),
            }
          },
        }),

        createHabit: tool({
          description: 'Create a new habit for the user',
          parameters: z.object({
            name: z.string().describe('Habit name'),
            description: z.string().optional().describe('Habit description'),
            frequencyType: z.enum(['daily', 'weekly']).optional().describe('How often the habit should be done'),
            targetFrequency: z.number().optional().describe('Target times per frequency period'),
          }),
          execute: async ({ name, description, frequencyType, targetFrequency }) => {
            const habit = await prisma.habit.create({
              data: {
                userId,
                name,
                description,
                frequencyType: frequencyType || 'daily',
                targetFrequency: targetFrequency || 1,
                isActive: true,
              },
            })
            return { success: true, habit: { id: habit.id, name: habit.name } }
          },
        }),

        logHabit: tool({
          description: 'Log a habit completion for today',
          parameters: z.object({
            habitId: z.string().describe('The ID of the habit to log'),
            notes: z.string().optional().describe('Optional notes for the log entry'),
          }),
          execute: async ({ habitId, notes }) => {
            // Verify the habit belongs to the user
            const habit = await prisma.habit.findFirst({
              where: { id: habitId, userId },
            })
            if (!habit) return { success: false, error: 'Habit not found' }

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const log = await prisma.habitLog.upsert({
              where: { habitId_date: { habitId, date: today } },
              create: {
                habitId,
                userId,
                date: today,
                completedCount: 1,
                notes,
              },
              update: {
                completedCount: { increment: 1 },
                notes,
              },
            })
            return { success: true, log: { id: log.id, habitName: habit.name, completedCount: log.completedCount } }
          },
        }),
      },
      maxSteps: 5,
    })

    // Collect tool results from all steps
    const toolResults = result.steps
      .flatMap((step) => step.toolResults)
      .filter(Boolean)

    return {
      response: result.text,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
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
