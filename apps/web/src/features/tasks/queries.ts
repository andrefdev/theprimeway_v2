import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type { CreateTaskInput, UpdateTaskInput } from '@repo/shared/validators'

export const tasksQueries = {
  all: () => ['tasks'] as const,

  list: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'list', params],
      queryFn: () => tasksApi.list(params),
      staleTime: CACHE_TIMES.standard,
    }),

  today: (referenceDate: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'list', { filter: 'today', referenceDate }],
      queryFn: () => tasksApi.list({ filter: 'today', referenceDate }),
      staleTime: CACHE_TIMES.standard,
    }),

  grouped: (params: { referenceDate: string; startDate?: string; endDate?: string }) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'grouped', params],
      queryFn: () => tasksApi.grouped(params),
      staleTime: CACHE_TIMES.standard,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'detail', id],
      queryFn: () => tasksApi.get(id),
      staleTime: CACHE_TIMES.standard,
    }),

  stats: (referenceDate: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'stats', referenceDate],
      queryFn: () => tasksApi.stats(referenceDate),
      staleTime: CACHE_TIMES.short,
    }),

  scheduleSuggestion: (targetDate: string, estimatedDuration: number, preferredTime?: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'schedule-suggestion', targetDate, estimatedDuration, preferredTime],
      queryFn: () =>
        tasksApi.getScheduleSuggestion(
          targetDate,
          estimatedDuration,
          preferredTime as 'morning' | 'afternoon' | 'evening' | undefined,
        ),
      staleTime: 0, // Always fetch fresh for schedule suggestions
      enabled: !!targetDate && estimatedDuration > 0,
    }),

  insight: (taskId: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'insight', taskId],
      queryFn: () => tasksApi.getTaskInsight(taskId),
      staleTime: CACHE_TIMES.long,
    }),

  nextTask: () =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'next'],
      queryFn: () => tasksApi.suggestNextTask(),
      staleTime: 0,
    }),

  completionImpact: (taskId: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'completion-impact', taskId],
      queryFn: () => tasksApi.getCompletionImpact(taskId),
      staleTime: CACHE_TIMES.standard,
      enabled: !!taskId,
    }),

  scheduleConflicts: (date: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'schedule-conflicts', date],
      queryFn: () => tasksApi.getScheduleConflicts(date),
      staleTime: CACHE_TIMES.standard,
      enabled: !!date,
    }),

  calendarView: (start: string, end: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'calendar-view', start, end],
      queryFn: () => tasksApi.getCalendarView(start, end),
      staleTime: CACHE_TIMES.standard,
      enabled: !!start && !!end,
    }),

  timelineView: (start: string, end: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'timeline-view', start, end],
      queryFn: () => tasksApi.getTimelineView(start, end),
      staleTime: CACHE_TIMES.standard,
      enabled: !!start && !!end,
    }),

  serverStats: (days?: number) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'server-stats', days],
      queryFn: () => tasksApi.getServerStats(days),
      staleTime: CACHE_TIMES.standard,
    }),
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateTaskInput> }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    },
  })
}

export function useEstimateTimebox() {
  return useMutation({
    mutationFn: ({ title, description, taskId }: { title: string; description?: string; taskId?: string }) =>
      tasksApi.estimateTimebox(title, description, taskId),
  })
}

export function useScheduleTask() {
  return useMutation({
    mutationFn: ({ taskId, duration }: { taskId: string; duration?: number }) =>
      tasksApi.scheduleTask(taskId, duration),
  })
}

export function useStartTimer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.startTimer(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    },
  })
}

export function useStopTimer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.stopTimer(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    },
  })
}
