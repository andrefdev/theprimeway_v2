import { chatRepo } from '../repositories/chat.repo'
import { prisma } from '../lib/prisma'
import { generateObject, generateText, streamText, tool, stepCountIs, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { chatModel, taskModel } from '../lib/ai-models'
import { z } from 'zod'
import { calendarService } from './calendar.service'
import { habitsService } from './habits.service'
import { notesService } from './notes.service'
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

  async buildSystemPrompt(userId: string, locale: string) {
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

    return `You are a productivity assistant for ThePrimeWay, a personal productivity app.
You help the user manage their tasks and habits. Be concise, actionable, and encouraging.
Respond in ${locale === 'es' ? 'Spanish' : 'English'}.

Current date: ${new Date().toISOString().split('T')[0]}

User's open tasks:
${taskContext || '(no open tasks)'}

User's active habits:
${habitContext || '(no active habits)'}

Available tools span tasks, habits, goals, notes, calendar, and pomodoro.

Read tools (run automatically, no confirmation): listTasks, listHabits, listGoals, listNotes, listCalendarEvents, findFreeSlots.
Write tools (require user approval in UI): createTask, updateTask, deleteTask, completeTask, createHabit, updateHabit, logHabit, createGoal, updateGoalProgress, createTimeBlock, createNote, updateNote, deleteNote, startPomodoro.

Workflow:
1. If you need current data (list of habits, goals, notes, events, free slots), call a read tool first — do NOT guess IDs.
2. Propose writes only after you have the relevant IDs. The user will accept or reject; summarize the outcome afterward.
3. Do NOT invent IDs. Use IDs from context above or from tool results.`
  }

  /**
   * Streaming chat for the agentic UI. Read-only tools execute on the server;
   * destructive tools are declared without an execute function so the client
   * can render a confirmation UI and call the corresponding REST endpoint
   * only when the user accepts.
   */
  async chatStream(
    userId: string,
    body: { messages: UIMessage[]; locale?: string },
  ) {
    const locale = body.locale || 'en'
    const system = await this.buildSystemPrompt(userId, locale)

    return streamText({
      model: chatModel,
      system,
      messages: convertToModelMessages(body.messages),
      tools: {
        // Read-only — safe to execute without confirmation
        listTasks: tool({
          description: "List the user's open tasks",
          inputSchema: z.object({
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

        // Client-side (no execute). The model proposes; the client shows a
        // preview and either runs the mutation or rejects it.
        createTask: tool({
          description: 'Propose creating a new task. Requires user approval in the UI.',
          inputSchema: z.object({
            title: z.string().describe('Task title'),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            dueDate: z.string().optional().describe('YYYY-MM-DD'),
            scheduledDate: z.string().optional().describe('YYYY-MM-DD'),
          }),
        }),

        completeTask: tool({
          description: 'Propose marking a task as completed. Requires user approval.',
          inputSchema: z.object({
            taskId: z.string(),
            taskTitle: z.string().describe('Human-readable title to display in the confirmation UI'),
          }),
        }),

        createHabit: tool({
          description: 'Propose creating a new habit. Requires user approval.',
          inputSchema: z.object({
            name: z.string(),
            description: z.string().optional(),
            frequencyType: z.enum(['daily', 'weekly']).optional(),
            targetFrequency: z.number().optional(),
          }),
        }),

        logHabit: tool({
          description: "Propose logging today's completion for a habit. Requires user approval.",
          inputSchema: z.object({
            habitId: z.string(),
            habitName: z.string().describe('Human-readable name for the UI'),
            notes: z.string().optional(),
          }),
        }),

        // ── Read-only server-exec tools ─────────────────────────────────────
        listHabits: tool({
          description: "List the user's active habits",
          inputSchema: z.object({
            includeLogs: z.boolean().optional().describe('Include recent log history'),
          }),
          execute: async ({ includeLogs }) => {
            const { data } = await habitsService.listHabits(userId, {
              isActive: true,
              includeLogs: includeLogs ?? false,
              limit: 50,
              offset: 0,
            } as any)
            return {
              habits: data.map((h: any) => ({
                id: h.id,
                name: h.name,
                frequencyType: h.frequencyType,
                targetFrequency: h.targetFrequency,
                category: h.category,
              })),
            }
          },
        }),

        listGoals: tool({
          description: "List the user's goals across all hierarchy levels (3-year, annual, quarterly)",
          inputSchema: z.object({
            limit: z.number().optional(),
            level: z.enum(['three-year', 'annual', 'quarterly', 'all']).optional().describe('Hierarchy level'),
          }),
          execute: async ({ limit, level }) => {
            const max = limit ?? 20
            const lv = level ?? 'all'
            const out: Array<{ id: string; title: string; level: string; progress?: number; parentId?: string }> = []

            const horizonMap = { 'three-year': 'THREE_YEAR', annual: 'ONE_YEAR', quarterly: 'QUARTER' } as const
            const wantHorizons = lv === 'all'
              ? (['THREE_YEAR', 'ONE_YEAR', 'QUARTER'] as const)
              : [horizonMap[lv]] as const
            const goals = await prisma.goal.findMany({
              where: { userId, horizon: { in: wantHorizons as any }, status: 'ACTIVE' },
              take: max,
              orderBy: { createdAt: 'desc' },
            })
            for (const g of goals) {
              const levelLabel = g.horizon === 'THREE_YEAR' ? 'three-year' : g.horizon === 'ONE_YEAR' ? 'annual' : 'quarterly'
              out.push({ id: g.id, title: g.title, level: levelLabel, parentId: g.parentGoalId ?? undefined })
            }
            return { goals: out.slice(0, max) }
          },
        }),

        listNotes: tool({
          description: "List the user's recent notes",
          inputSchema: z.object({
            limit: z.number().optional(),
            search: z.string().optional(),
          }),
          execute: async ({ limit, search }) => {
            const { data } = await notesService.listNotes(userId, {
              limit: limit ?? 20,
              offset: 0,
              search,
            } as any)
            return {
              notes: data.map((n: any) => ({
                id: n.id,
                title: n.title,
                snippet: typeof n.content === 'string' ? n.content.slice(0, 160) : undefined,
                isPinned: n.isPinned,
                updatedAt: n.updatedAt,
              })),
            }
          },
        }),

        listCalendarEvents: tool({
          description: 'List calendar events between two ISO timestamps',
          inputSchema: z.object({
            from: z.string().describe('Start ISO datetime'),
            to: z.string().describe('End ISO datetime'),
          }),
          execute: async ({ from, to }) => {
            try {
              const events = await calendarService.getGoogleEvents(userId, from, to)
              return {
                events: (events as any[]).slice(0, 50).map((e) => ({
                  title: e.summary ?? e.title,
                  start: e.start?.dateTime ?? e.start?.date ?? e.start,
                  end: e.end?.dateTime ?? e.end?.date ?? e.end,
                  location: e.location,
                })),
              }
            } catch (err: any) {
              return { error: err?.message ?? 'Failed to fetch events', events: [] }
            }
          },
        }),

        findFreeSlots: tool({
          description: 'Find free calendar slots on a given date that fit a minimum duration',
          inputSchema: z.object({
            date: z.string().describe('YYYY-MM-DD'),
            durationMinutes: z.number().describe('Minimum slot length in minutes'),
          }),
          execute: async ({ date, durationMinutes }) => {
            const res: any = await calendarService.getFreeSlots(userId, date, durationMinutes)
            return res
          },
        }),

        // ── Client-approval write tools (no execute) ────────────────────────
        updateTask: tool({
          description: 'Propose updating an existing task. Requires user approval.',
          inputSchema: z.object({
            taskId: z.string(),
            taskTitle: z.string().describe('Current title for display'),
            title: z.string().optional(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            dueDate: z.string().optional(),
            scheduledDate: z.string().optional(),
          }),
        }),

        deleteTask: tool({
          description: 'Propose deleting a task. Requires user approval.',
          inputSchema: z.object({
            taskId: z.string(),
            taskTitle: z.string().describe('For display in the confirmation UI'),
          }),
        }),

        updateHabit: tool({
          description: 'Propose updating an existing habit. Requires user approval.',
          inputSchema: z.object({
            habitId: z.string(),
            habitName: z.string().describe('Current name for display'),
            name: z.string().optional(),
            description: z.string().optional(),
            targetFrequency: z.number().optional(),
            frequencyType: z.enum(['daily', 'weekly']).optional(),
            isActive: z.boolean().optional(),
          }),
        }),

        createGoal: tool({
          description: 'Propose creating a new goal at a hierarchy level (three-year, annual, or quarterly). Requires user approval.',
          inputSchema: z.object({
            level: z.enum(['three-year', 'annual', 'quarterly']).describe('Hierarchy level'),
            title: z.string(),
            description: z.string().optional(),
            visionId: z.string().optional().describe('Required when level is three-year'),
            area: z.enum(['finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle']).optional().describe('Required when level is three-year'),
            threeYearGoalId: z.string().optional().describe('Required when level is annual'),
            targetDate: z.string().optional().describe('YYYY-MM-DD, used for annual'),
            annualGoalId: z.string().optional().describe('Required when level is quarterly'),
            year: z.number().optional().describe('Required when level is quarterly'),
            quarter: z.number().min(1).max(4).optional().describe('Required when level is quarterly'),
          }),
        }),

        updateGoalProgress: tool({
          description: 'Propose updating a goal progress percentage. Applies to annual or quarterly goals. Requires user approval.',
          inputSchema: z.object({
            level: z.enum(['annual', 'quarterly']),
            goalId: z.string(),
            goalTitle: z.string().describe('For display'),
            progress: z.number().min(0).max(100),
          }),
        }),

        createTimeBlock: tool({
          description: 'Propose creating a calendar time block. Requires user approval.',
          inputSchema: z.object({
            title: z.string(),
            date: z.string().describe('YYYY-MM-DD'),
            startTime: z.string().describe('HH:MM (24h)'),
            endTime: z.string().describe('HH:MM (24h)'),
            description: z.string().optional(),
          }),
        }),

        createNote: tool({
          description: 'Propose creating a new note. Requires user approval.',
          inputSchema: z.object({
            title: z.string(),
            content: z.string(),
            tags: z.array(z.string()).optional(),
          }),
        }),

        updateNote: tool({
          description: 'Propose updating a note. Requires user approval.',
          inputSchema: z.object({
            noteId: z.string(),
            noteTitle: z.string().describe('Current title for display'),
            title: z.string().optional(),
            content: z.string().optional(),
          }),
        }),

        deleteNote: tool({
          description: 'Propose deleting a note. Requires user approval.',
          inputSchema: z.object({
            noteId: z.string(),
            noteTitle: z.string().describe('For display'),
          }),
        }),

        startPomodoro: tool({
          description: 'Propose starting a pomodoro focus session. Requires user approval.',
          inputSchema: z.object({
            durationMinutes: z.number().describe('Session length in minutes'),
            taskId: z.string().optional().describe('Optional linked task'),
            taskTitle: z.string().optional().describe('For display'),
          }),
        }),
      },
      stopWhen: stepCountIs(5),
    })
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
      model: chatModel,
      system: systemPrompt,
      messages: body.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      tools: {
        createTask: tool({
          description: 'Create a new task for the user',
          inputSchema: z.object({
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
          inputSchema: z.object({
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
          inputSchema: z.object({
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
          inputSchema: z.object({
            name: z.string().describe('Habit name'),
            description: z.string().optional().describe('Habit description'),
            frequencyType: z.enum(['daily', 'weekly']).optional().describe('How often the habit should be done'),
            targetFrequency: z.number().optional().describe('Target times per frequency period'),
          }),
          execute: async ({ name, description, frequencyType, targetFrequency }) => {
            const habit = await prisma.task.create({
              data: {
                userId,
                kind: 'HABIT',
                title: name,
                description,
                tags: [],
                habitMeta: {
                  category: null,
                  color: '#3B82F6',
                  targetFrequency: targetFrequency || 1,
                  frequencyType: frequencyType || 'daily',
                  weekDays: [],
                } as any,
              },
            })
            return { success: true, habit: { id: habit.id, name: habit.title } }
          },
        }),

        logHabit: tool({
          description: 'Log a habit completion for today',
          inputSchema: z.object({
            habitId: z.string().describe('The ID of the habit to log'),
            notes: z.string().optional().describe('Optional notes for the log entry'),
          }),
          execute: async ({ habitId, notes }) => {
            // Verify the habit belongs to the user
            const habit = await prisma.task.findFirst({
              where: { id: habitId, userId, kind: 'HABIT' },
            })
            if (!habit) return { success: false, error: 'Habit not found' }

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const log = await prisma.habitLog.upsert({
              where: { taskId_date: { taskId: habitId, date: today } },
              create: {
                taskId: habitId,
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
            return { success: true, log: { id: log.id, habitName: habit.title, completedCount: log.completedCount } }
          },
        }),
      },
      stopWhen: stepCountIs(5),
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

    const [openTasks, completedTasksToday, habits, habitLogs] = await Promise.all([
      chatRepo.findOpenTasks(userId, 20),
      prisma.task.count({
        where: {
          userId,
          status: 'completed',
          updatedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      chatRepo.findActiveHabits(userId),
      chatRepo.findHabitLogsByDate(userId, todayStart, todayEnd),
    ])

    const habitsCompleted = habitLogs.filter((l) => (l.completedCount ?? 0) > 0).length
    const tasksToday = openTasks.length + completedTasksToday
    const habitsToday = habits.length

    let summary = ''
    try {
      const res = await generateText({
        model: chatModel,
        prompt: `Write a friendly one-sentence daily briefing for a productivity app user.
Today: ${todayStart.toISOString().split('T')[0]}
Open tasks: ${openTasks.length}
Tasks completed today: ${completedTasksToday}
Active habits: ${habitsToday}
Habits completed today: ${habitsCompleted}

Keep it under 30 words. Be concrete and encouraging. No emojis.`,
      })
      summary = res.text.trim()
    } catch {
      summary = ''
    }

    return {
      summary,
      tasksCompleted: completedTasksToday,
      tasksToday,
      habitsCompleted,
      habitsToday,
      upcomingEvents: 0,
      streak: 0,
    }
  }

  async weeklyPlanning(userId: string, weekStartDate: string) {
    const weekStart = new Date(weekStartDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const [quarterlyGoals, habits, openTasks, workingHours] = await Promise.all([
      chatRepo.findActiveGoalsByUser(userId),
      chatRepo.findActiveHabits(userId),
      chatRepo.findOpenTasks(userId, 100),
      prisma.workingHours.findMany({ where: { userId, channelId: null }, orderBy: { dayOfWeek: 'asc' } }),
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
      .map((g) => `- ${g.title} (progress: ${Math.round((g.visionContribution ?? 0) * 100)}%)`)
      .join('\n')

    const firstDay = workingHours[0]
    const workHours = firstDay ? `${firstDay.startTime} - ${firstDay.endTime}` : '09:00 - 17:00'

    const result = await generateObject({
      model: taskModel,
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

    return result.object
  }
}

export const chatService = new ChatService()
