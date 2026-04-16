import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

  // AI Queries
  analysis: (id: string) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'analysis', id],
      queryFn: () => habitsApi.analyzeHabit(id),
      staleTime: CACHE_TIMES.long,
    }),

  optimalReminderTime: (id: string) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'optimalTime', id],
      queryFn: () => habitsApi.getOptimalReminderTime(id),
      staleTime: CACHE_TIMES.long,
    }),

  goalSuggestions: (id: string) =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'goalSuggestions', id],
      queryFn: () => habitsApi.suggestGoalsForHabit(id),
      staleTime: CACHE_TIMES.standard,
    }),

  aiSuggestions: () =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'aiSuggestions'],
      queryFn: () => habitsApi.suggestHabitsForGoals(),
      staleTime: CACHE_TIMES.long,
    }),

  habitStacking: () =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'habitStacking'],
      queryFn: () => habitsApi.suggestHabitStacking(),
      staleTime: CACHE_TIMES.long,
    }),

  correlations: () =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'correlations'],
      queryFn: () => habitsApi.analyzeCorrelations(),
      staleTime: CACHE_TIMES.long,
    }),

  streakProtection: () =>
    queryOptions({
      queryKey: [...habitsQueries.all(), 'streak-protection'],
      queryFn: () => habitsApi.getStreakProtection(),
      staleTime: 5 * 60 * 1000, // 5 min
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

// AI Hooks

export function useHabitAnalysis(habitId: string) {
  return useQuery(habitsQueries.analysis(habitId))
}

export function useOptimalReminderTime(habitId: string) {
  return useQuery(habitsQueries.optimalReminderTime(habitId))
}

export function useGoalSuggestions(habitId: string) {
  return useQuery(habitsQueries.goalSuggestions(habitId))
}

export function useHabitCorrelations() {
  return useQuery(habitsQueries.correlations())
}

export function useLinkHabitToGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, goalId }: { habitId: string; goalId: string | null }) =>
      habitsApi.update(habitId, { goalId: goalId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    },
  })
}
