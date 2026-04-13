/**
 * Tasks Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Business rules (auto-scheduling, validation, XP awards)
 * - Cross-domain logic (calendar sync, gamification)
 * - NO Prisma queries, NO HTTP concerns
 */
import { tasksRepository } from '../repositories/tasks.repo'
import { calendarService } from './calendar.service'
import { gamificationService } from './gamification.service'
import { scheduleOptimizer } from './schedule-optimizer'
import { validateLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'
import { prisma } from '../lib/prisma'
import type { Task } from '@prisma/client'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

type TaskModel = Task & { weeklyGoal?: unknown }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CreateTaskInput {
  title: string
  description?: string
  priority?: string
  dueDate?: string
  scheduledDate?: string
  scheduledStart?: string
  scheduledEnd?: string
  isAllDay?: boolean
  estimatedDuration?: number
  backlogState?: string
  source?: string
  tags?: string[]
  weeklyGoalId?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: string
  scheduledDate?: string
  scheduledStart?: string
  scheduledEnd?: string
  isAllDay?: boolean
  estimatedDuration?: number
  backlogState?: string
  tags?: string[]
  weeklyGoalId?: string
  archivedAt?: string | null
  orderInDay?: number
}

export interface ListTasksFilters {
  filter?: 'today' | 'backlog' | 'archive' | 'week'
  status?: string
  priority?: string
  referenceDate?: string
  weeklyGoalId?: string
  weekStart?: string
  weekEnd?: string
  limit?: number
  offset?: number
}

export interface GroupedTasksResult {
  groups: Array<{ date_key: string; tasks: TaskModel[] }>
  archive: TaskModel[]
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class TasksService {
  /** List tasks with various filter strategies */
  async listTasks(userId: string, filters: ListTasksFilters): Promise<{ data: TaskModel[]; count: number }> {
    const ref = filters.referenceDate || new Date().toISOString().split('T')[0]!

    let data: TaskModel[]

    switch (filters.filter) {
      case 'today':
        data = await tasksRepository.findTodaysTasks(userId, ref)
        break
      case 'backlog':
        data = await tasksRepository.findBacklogTasks(userId)
        break
      case 'archive':
        data = await tasksRepository.findArchivedTasks(userId)
        break
      case 'week':
        data = await tasksRepository.findWeekTasks(
          userId,
          filters.weekStart || ref,
          filters.weekEnd || ref,
        )
        break
      default:
        data = await tasksRepository.findMany(userId, {
          status: filters.status,
          priority: filters.priority,
          weeklyGoalId: filters.weeklyGoalId,
          limit: filters.limit,
          offset: filters.offset,
        })
    }

    return { data, count: data.length }
  }

  /** Get grouped tasks for dashboard view */
  async getGroupedTasks(userId: string, referenceDate: string): Promise<GroupedTasksResult> {
    // Auto-archive past incomplete tasks
    await tasksRepository.archivePastTasks(userId, referenceDate)

    // Fetch open tasks and archive
    const [openTasks, archivedTasks] = await Promise.all([
      tasksRepository.findMany(userId, { status: 'open', archivedAt: null }),
      tasksRepository.findArchivedTasks(userId),
    ])

    // Group by scheduled date
    const groupMap = new Map<string, TaskModel[]>()

    for (const task of openTasks) {
      const dateKey = task.scheduledDate
        ? task.scheduledDate.toISOString().split('T')[0]!
        : 'no-date'

      console.log('📊 Task grouping - taskId:', task.id, 'scheduledDate:', task.scheduledDate, 'dateKey:', dateKey)

      if (!groupMap.has(dateKey)) groupMap.set(dateKey, [])
      groupMap.get(dateKey)!.push(task)
    }

    // Sort groups: dates ascending, 'no-date' at end
    const groups = Array.from(groupMap.entries())
      .sort(([a], [b]) => {
        if (a === 'no-date') return 1
        if (b === 'no-date') return -1
        return a.localeCompare(b)
      })
      .map(([date_key, tasks]) => ({ date_key, tasks }))

    return { groups, archive: archivedTasks }
  }

  /** Get a single task */
  async getTask(userId: string, taskId: string): Promise<TaskModel | null> {
    return tasksRepository.findById(userId, taskId)
  }

  /** Create a new task with optional auto-scheduling */
  async createTask(userId: string, input: CreateTaskInput): Promise<TaskModel> {
    console.log('📥 TasksService.createTask - input:', input)
    // Check task limit
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
      validateLimit(FEATURES.TASKS_LIMIT, plan, usage?.currentTasks ?? 0)
    }

    const data: Record<string, any> = {
      title: input.title,
      description: input.description,
      priority: input.priority || 'medium',
      tags: input.tags || [],
      weeklyGoalId: input.weeklyGoalId,
      isAllDay: input.isAllDay,
      estimatedDurationMinutes: input.estimatedDuration,
      backlogState: input.backlogState,
      source: input.source,
    }

    if (input.dueDate) data.dueDate = input.dueDate
    if (input.scheduledDate) data.scheduledDate = input.scheduledDate
    if (input.scheduledStart) data.scheduledStart = input.scheduledStart
    if (input.scheduledEnd) data.scheduledEnd = input.scheduledEnd

    console.log('📥 TasksService.createTask - data to be saved:', data)
    return tasksRepository.create(userId, data)
  }

  /** Update a task with business rules */
  async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskModel | null> {
    // Validate title if provided
    if (input.title !== undefined && (!input.title.trim() || input.title.length > 255)) {
      throw new Error('Title must be 1-255 characters')
    }

    // Get current task to check if status is changing to 'completed'
    const currentTask = await tasksRepository.findById(userId, taskId)
    if (!currentTask) return null

    // Map camelCase input to repository format
    const data: Record<string, any> = {}

    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.status !== undefined) data.status = input.status
    if (input.priority !== undefined) data.priority = input.priority
    if (input.dueDate !== undefined) data.dueDate = input.dueDate
    if (input.scheduledDate !== undefined) data.scheduledDate = input.scheduledDate
    if (input.scheduledStart !== undefined) data.scheduledStart = input.scheduledStart
    if (input.scheduledEnd !== undefined) data.scheduledEnd = input.scheduledEnd
    if (input.isAllDay !== undefined) data.isAllDay = input.isAllDay
    if (input.estimatedDuration !== undefined) data.estimatedDurationMinutes = input.estimatedDuration
    if (input.backlogState !== undefined) data.backlogState = input.backlogState
    if (input.tags !== undefined) data.tags = input.tags
    if (input.weeklyGoalId !== undefined) data.weeklyGoalId = input.weeklyGoalId
    if (input.archivedAt !== undefined) data.archivedAt = input.archivedAt
    if (input.orderInDay !== undefined) data.orderInDay = input.orderInDay

    const updatedTask = await tasksRepository.update(userId, taskId, data)

    // Auto-award XP if task is being completed for the first time
    if (input.status === 'completed' && currentTask.status !== 'completed' && updatedTask) {
      const xpAmount = currentTask.weeklyGoalId ? 40 : 15
      await gamificationService.awardXp(userId, {
        source: 'task',
        sourceId: taskId,
        amount: xpAmount,
        metadata: { taskTitle: currentTask.title },
      })
    }

    return updatedTask
  }

  /** Delete a task */
  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    return tasksRepository.delete(userId, taskId)
  }

  /** Get schedule suggestion based on calendar events and existing tasks */
  async getScheduleSuggestion(
    userId: string,
    targetDate: string, // YYYY-MM-DD
    estimatedDuration: number, // minutes
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ) {
    // Get all tasks for this day
    const tasks = await tasksRepository.findMany(userId, {})

    // Get calendar events for this day and the next (to handle time zones properly)
    const startOfDay = `${targetDate}T00:00:00Z`
    const endOfDay = `${targetDate}T23:59:59Z`

    const calendarEvents = await calendarService.getGoogleEvents(userId, startOfDay, endOfDay)

    // Convert calendar events to the format expected by scheduleOptimizer
    const events = calendarEvents.map((event: any) => ({
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      title: event.summary || 'Event',
    }))

    // Get all planned tasks (with scheduledDate and times)
    const plannedTasks = tasks.filter((t) => t.scheduledDate).map((t) => ({
      scheduledDate: t.scheduledDate ? t.scheduledDate.toISOString().split('T')[0] : undefined,
      scheduledStart: t.scheduledStart ? t.scheduledStart.toISOString() : undefined,
      scheduledEnd: t.scheduledEnd ? t.scheduledEnd.toISOString() : undefined,
    }))

    // Get schedule suggestion
    const suggestion = scheduleOptimizer.getSuggestion(
      plannedTasks,
      events,
      targetDate,
      estimatedDuration,
      preferredTime,
    )

    return suggestion
  }

  // ---------------------------------------------------------------------------
  // AI Methods
  // ---------------------------------------------------------------------------

  async estimateTimebox(
    userId: string,
    title: string,
    description?: string,
    taskId?: string,
  ): Promise<{ minutes: number; rationale: string }> {
    // Get user's recent tasks for context calibration
    const recentTasks = await tasksRepository.findMany(userId, {
      limit: 5,
    })

    const taskHistory = recentTasks
      .slice(0, 3)
      .map((t: any) => `- ${t.title}: ${t.estimatedDurationMinutes || '?'} min (actual: ${t.actualDurationMinutes || '?'} min)`)
      .join('\n')

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: z.object({
        minutes: z.number().int().positive().describe('Estimated duration in minutes'),
        rationale: z.string().describe('Brief explanation of the estimate'),
      }),
      prompt: `
Estimate the time required to complete this task:
Title: ${title}
${description ? `Description: ${description}` : ''}

Consider the user's task history for calibration:
${taskHistory || 'No recent tasks'}

Provide a realistic estimate in minutes.
      `,
    })

    // Optionally save to task if taskId provided
    if (taskId) {
      await tasksRepository.update(userId, taskId, {
        estimatedDurationMinutes: result.object.minutes,
      })
    }

    return result.object
  }

  async scheduleTask(userId: string, taskId: string, duration?: number): Promise<{ slot: { start: string; end: string } | null; confidence: number }> {
    const task = await tasksRepository.findById(userId, taskId)
    if (!task) {
      return { slot: null, confidence: 0 }
    }

    const taskDuration = duration || task.estimatedDurationMinutes || 60

    // Get today's date
    const today = new Date().toISOString().split('T')[0]!

    // Get free slots from calendar
    const result = await calendarService.getFreeSlots(userId, today, taskDuration)
    if ('error' in result || result.freeSlots.length === 0) {
      return { slot: null, confidence: 0 }
    }

    // Pick the best slot (first available for now, could be enhanced with AI)
    const bestSlot = result.freeSlots[0]
    if (!bestSlot) {
      return { slot: null, confidence: 0 }
    }

    return {
      slot: {
        start: bestSlot.start,
        end: bestSlot.end,
      },
      confidence: 0.8,
    }
  }

  async getTaskInsight(userId: string, taskId: string): Promise<{ contextBrief: string; suggestedSubtasks: string[]; tips: string[] }> {
    const task = await tasksRepository.findById(userId, taskId)
    if (!task) {
      return { contextBrief: '', suggestedSubtasks: [], tips: [] }
    }

    // Get parent goal if exists
    let goalContext = ''
    if ((task as any).weeklyGoalId) {
      const goal = await prisma.weeklyGoal.findUnique({
        where: { id: (task as any).weeklyGoalId },
        select: { title: true, description: true },
      })
      if (goal) {
        goalContext = `Parent goal: ${goal.title}${goal.description ? ` (${goal.description})` : ''}`
      }
    }

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: z.object({
        contextBrief: z.string().describe('Brief context about the task'),
        suggestedSubtasks: z.array(z.string()).describe('3-5 suggested subtasks'),
        tips: z.array(z.string()).describe('2-3 practical tips for completing this task'),
      }),
      prompt: `
Analyze this task and provide insights:
Title: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Priority: ${task.priority || 'normal'}
${goalContext}

Provide:
1. A brief context summary
2. 3-5 suggested subtasks to break this down
3. 2-3 practical tips
      `,
    })

    // Cache the insight in the task
    if (taskId) {
      await tasksRepository.update(userId, taskId, {
        aiInsightJson: result.object,
      })
    }

    return result.object
  }
}

export const tasksService = new TasksService()
