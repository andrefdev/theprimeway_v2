import { api } from '@/shared/lib/api-client'
import type { Task } from '@repo/shared/types'
import type { CreateTaskInput, UpdateTaskInput } from '@repo/shared/validators'

interface TasksResponse {
  data: Task[]
  count: number
}

interface TaskResponse {
  data: Task
}

interface ScheduleSuggestionResponse {
  data: {
    start: string
    end: string
  } | null
}

interface TimeboxEstimateResponse {
  data: {
    minutes: number
    rationale: string
  }
}

interface TaskInsightResponse {
  data: {
    contextBrief: string
    suggestedSubtasks: string[]
    tips: string[]
    suggestedGoalId?: string
    suggestedGoalTitle?: string
  }
}

interface TaskScheduleResponse {
  data: {
    slot: {
      start: string
      end: string
    } | null
    confidence: number
  }
}

interface NextTaskResponse {
  data: {
    taskId: string
    title: string
    reason: string
    confidence: number
  } | null
}

interface CompletionImpactResponse {
  data: {
    task: { id: string; title: string; priority: string }
    goalProgress: { title: string; progress: number; tasksRemaining: number } | null
    todayStats: { tasksCompleted: number; habitsCompleted: number; xpEarned: number }
    timeStats: { actual: number; estimated: number | null; accuracy: number | null } | null
    xpAwarded: number
  }
}

interface ScheduleConflictsResponse {
  data: {
    conflicts: Array<{
      taskId: string
      taskTitle: string
      taskStart: string
      taskEnd: string
      conflictsWith: string
      conflictType: 'calendar_event' | 'task_overlap'
    }>
    suggestions: Array<{
      taskId: string
      taskTitle: string
      suggestedStart: string
      suggestedEnd: string
    }>
  }
}

export const tasksApi = {
  list: (params?: Record<string, string>) =>
    api.get<TasksResponse>('/tasks', { params }).then((r) => r.data),

  grouped: (referenceDate: string) =>
    api.get<{ groups: Array<{ date_key: string; tasks: Task[] }>; archive: Task[] }>(
      '/tasks/grouped',
      { params: { referenceDate } },
    ).then((r) => r.data),

  get: (id: string) =>
    api.get<TaskResponse>(`/tasks/${id}`).then((r) => r.data),

  create: (data: CreateTaskInput) =>
    api.post<TaskResponse>('/tasks', data).then((r) => r.data),

  update: (id: string, data: Partial<UpdateTaskInput>) =>
    api.put<TaskResponse>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),

  stats: (referenceDate: string) =>
    api.get<{ completedToday: number; openToday: number; totalToday: number }>(
      '/tasks/stats',
      { params: { referenceDate } },
    ).then((r) => r.data),

  autoArchive: () =>
    api.post('/tasks/auto-archive').then((r) => r.data),

  getScheduleSuggestion: (
    targetDate: string,
    estimatedDuration: number,
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ) => {
    const params: Record<string, string | number> = {
      targetDate,
      estimatedDuration,
    }
    if (preferredTime) {
      params.preferredTime = preferredTime
    }
    return api
      .get<ScheduleSuggestionResponse>('/tasks/schedule/suggest', { params })
      .then((r) => r.data.data)
  },

  estimateTimebox: (title: string, description?: string, taskId?: string) =>
    api
      .post<TimeboxEstimateResponse>('/tasks/ai/timebox', {
        title,
        description,
        taskId,
      })
      .then((r) => r.data.data),

  getTaskInsight: (taskId: string) =>
    api
      .get<TaskInsightResponse>(`/tasks/ai/insight/${taskId}`)
      .then((r) => r.data.data),

  scheduleTask: (taskId: string, duration?: number) =>
    api
      .post<TaskScheduleResponse>('/tasks/ai/schedule', {
        taskId,
        duration,
      })
      .then((r) => r.data.data),

  suggestNextTask: () =>
    api
      .get<NextTaskResponse>('/tasks/ai/next')
      .then((r) => r.data.data),

  getCompletionImpact: (taskId: string) =>
    api
      .get<CompletionImpactResponse>(`/tasks/${taskId}/impact`)
      .then((r) => r.data.data),

  getScheduleConflicts: (date: string) =>
    api
      .get<ScheduleConflictsResponse>('/tasks/schedule-conflicts', { params: { date } })
      .then((r) => r.data.data),

  generateRecurring: () =>
    api.post('/tasks/recurring/generate').then((r) => r.data),

  startTimer: (taskId: string) =>
    api.post<TaskResponse>(`/tasks/${taskId}/timer/start`).then((r) => r.data),

  stopTimer: (taskId: string) =>
    api.post<TaskResponse>(`/tasks/${taskId}/timer/stop`).then((r) => r.data),

  getCalendarView: (start: string, end: string) =>
    api
      .get<{ data: any }>('/tasks/views/calendar', { params: { start, end } })
      .then((r) => r.data.data),

  getTimelineView: (start: string, end: string) =>
    api
      .get<{ data: any }>('/tasks/views/timeline', { params: { start, end } })
      .then((r) => r.data.data),

  getServerStats: (days?: number) =>
    api
      .get<{ data: any }>('/tasks/stats', { params: days ? { days: String(days) } : undefined })
      .then((r) => r.data.data),
}
