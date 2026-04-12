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
import { scheduleOptimizer } from './schedule-optimizer'
import { featuresService } from './features.service'
import { validateLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'
import { prisma } from '../lib/prisma'
import type { Task } from '@prisma/client'

type TaskModel = Task & { weeklyGoal?: unknown }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CreateTaskInput {
  title: string
  description?: string
  priority?: string
  due_date?: string
  scheduled_date?: string
  scheduled_start?: string
  scheduled_end?: string
  is_all_day?: boolean
  estimated_duration_minutes?: number
  backlog_state?: string
  source?: string
  tags?: string[]
  weekly_goal_id?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  due_date?: string
  scheduled_date?: string
  scheduled_start?: string
  scheduled_end?: string
  is_all_day?: boolean
  estimated_duration_minutes?: number
  backlog_state?: string
  tags?: string[]
  weekly_goal_id?: string
  archived_at?: string | null
  order_in_day?: number
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
      weeklyGoalId: input.weekly_goal_id,
      isAllDay: input.is_all_day,
      estimatedDurationMinutes: input.estimated_duration_minutes,
      backlogState: input.backlog_state,
      source: input.source,
    }

    if (input.due_date) data.dueDate = input.due_date
    if (input.scheduled_date) data.scheduledDate = input.scheduled_date
    if (input.scheduled_start) data.scheduledStart = input.scheduled_start
    if (input.scheduled_end) data.scheduledEnd = input.scheduled_end

    return tasksRepository.create(userId, data)
  }

  /** Update a task with business rules */
  async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskModel | null> {
    // Validate title if provided
    if (input.title !== undefined && (!input.title.trim() || input.title.length > 255)) {
      throw new Error('Title must be 1-255 characters')
    }

    // Map snake_case input to camelCase for repository
    const data: Record<string, any> = {}

    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.status !== undefined) data.status = input.status
    if (input.priority !== undefined) data.priority = input.priority
    if (input.due_date !== undefined) data.dueDate = input.due_date
    if (input.scheduled_date !== undefined) data.scheduledDate = input.scheduled_date
    if (input.scheduled_start !== undefined) data.scheduledStart = input.scheduled_start
    if (input.scheduled_end !== undefined) data.scheduledEnd = input.scheduled_end
    if (input.is_all_day !== undefined) data.isAllDay = input.is_all_day
    if (input.estimated_duration_minutes !== undefined) data.estimatedDurationMinutes = input.estimated_duration_minutes
    if (input.backlog_state !== undefined) data.backlogState = input.backlog_state
    if (input.tags !== undefined) data.tags = input.tags
    if (input.weekly_goal_id !== undefined) data.weeklyGoalId = input.weekly_goal_id
    if (input.archived_at !== undefined) data.archivedAt = input.archived_at
    if (input.order_in_day !== undefined) data.orderInDay = input.order_in_day

    return tasksRepository.update(userId, taskId, data)
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
      scheduledStart: t.scheduledStart,
      scheduledEnd: t.scheduledEnd,
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
}

export const tasksService = new TasksService()
