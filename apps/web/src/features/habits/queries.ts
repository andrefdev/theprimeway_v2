import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type { CreateHabitInput, UpdateHabitInput, UpsertHabitLogInput } from '@repo/shared/validators'

export const habitsQueries = {
  all: () => ['habits'] as const,

  list: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'list', params],
      queryFn: () => habitsApi.list(params),
      staleTime: CACHE_TIMES.standard,
    }),

  todayWithLogs: (today: string) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'list', { isActive: 'true', includeLogs: 'true', applicableDate: today }],
      queryFn: () => habitsApi.list({ isActive: 'true', includeLogs: 'true', applicableDate: today }),
      staleTime: CACHE_TIMES.standard,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'detail', id],
      queryFn: () => habitsApi.get(id, true),
      staleTime: CACHE_TIMES.standard,
    }),

  stats: (period?: string) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'stats', period],
      queryFn: () => habitsApi.getStats(period ? { period } : undefined),
      staleTime: CACHE_TIMES.standard,
    }),
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateHabitInput) => habitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateHabitInput> }) =>
      habitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    },
  })
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: UpsertHabitLogInput }) =>
      habitsApi.upsertLog(habitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    },
  })
}
