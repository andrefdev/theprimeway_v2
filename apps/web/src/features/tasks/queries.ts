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

  grouped: (referenceDate: string) =>
    queryOptions({
      queryKey: [...tasksQueries.all(), 'grouped', referenceDate],
      queryFn: () => tasksApi.grouped(referenceDate),
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
