import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type { Habit, HabitLog } from '@repo/shared/types'
import type { CreateHabitInput, UpdateHabitInput, UpsertHabitLogInput } from '@repo/shared/validators'
import {
  listOps,
  patchQueries,
  rollbackQueries,
  snapshotQueries,
} from '@/shared/lib/optimistic'
import { playSound } from '@/shared/lib/sound'

interface HabitsListResponse {
  data: Habit[]
  count: number
}

export const habitsQueries = {
  all: () => ['habits'] as const,
  lists: () => [...habitsQueries.all(), 'list'] as const,

  list: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...habitsQueries.lists(), params],
      queryFn: () => habitsApi.list(params),
      staleTime: CACHE_TIMES.standard,
    }),

  todayWithLogs: (today: string) =>
    queryOptions({
      queryKey: [...habitsQueries.lists(), { isActive: 'true', includeLogs: 'true', applicableDate: today }],
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
      staleTime: 5 * 60 * 1000,
    }),
}

function tempId(prefix: string) {
  return `${prefix}-tmp-${Math.random().toString(36).slice(2, 10)}`
}

function applyLogToHabit(habit: Habit, data: UpsertHabitLogInput): Habit {
  const logs = habit.logs ?? []
  const existing = logs.find((l) => l.date === data.date)
  const now = new Date().toISOString()
  const nextLog: HabitLog = existing
    ? { ...existing, completedCount: data.completedCount, notes: data.notes ?? existing.notes, updatedAt: now }
    : {
        id: tempId('log'),
        habitId: habit.id,
        userId: habit.userId,
        date: data.date,
        completedCount: data.completedCount,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
      }
  const nextLogs = existing
    ? logs.map((l) => (l.date === data.date ? nextLog : l))
    : [...logs, nextLog]
  return { ...habit, logs: nextLogs }
}

export function useCreateHabit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateHabitInput) => habitsApi.create(data),
    onMutate: async (data) => {
      const snaps = await snapshotQueries<HabitsListResponse>(qc, habitsQueries.lists())
      const now = new Date().toISOString()
      const optimistic: Habit = {
        id: tempId('habit'),
        userId: '',
        name: data.name,
        description: data.description ?? null,
        category: data.category ?? null,
        color: data.color ?? null,
        targetFrequency: data.targetFrequency ?? 1,
        frequencyType: data.frequencyType ?? 'daily',
        weekDays: data.weekDays ?? [],
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        logs: [],
      }
      patchQueries<HabitsListResponse>(qc, habitsQueries.lists(), (cur) => ({
        ...cur,
        data: [...cur.data, optimistic],
        count: cur.count + 1,
      }))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: habitsQueries.all() }),
  })
}

export function useUpdateHabit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateHabitInput> }) =>
      habitsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      const snaps = await snapshotQueries<HabitsListResponse>(qc, habitsQueries.lists())
      patchQueries<HabitsListResponse>(qc, habitsQueries.lists(), (cur) => ({
        ...cur,
        data: listOps.patch(cur.data, id, data as Partial<Habit>),
      }))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: habitsQueries.all() }),
  })
}

export function useDeleteHabit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onMutate: async (id) => {
      const snaps = await snapshotQueries<HabitsListResponse>(qc, habitsQueries.lists())
      patchQueries<HabitsListResponse>(qc, habitsQueries.lists(), (cur) => ({
        ...cur,
        data: listOps.remove(cur.data, id),
        count: Math.max(0, cur.count - 1),
      }))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: habitsQueries.all() }),
  })
}

export function useToggleHabitLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: UpsertHabitLogInput }) =>
      habitsApi.upsertLog(habitId, data),
    onMutate: async ({ habitId, data }) => {
      const snaps = await snapshotQueries<HabitsListResponse>(qc, habitsQueries.lists())
      patchQueries<HabitsListResponse>(qc, habitsQueries.lists(), (cur) => ({
        ...cur,
        data: cur.data.map((h) => (h.id === habitId ? applyLogToHabit(h, data) : h)),
      }))
      return { snaps }
    },
    onSuccess: (_res, vars) => {
      if ((vars.data?.completedCount ?? 0) > 0) playSound('habitComplete')
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: habitsQueries.all() }),
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
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, goalId }: { habitId: string; goalId: string | null }) =>
      habitsApi.update(habitId, { goalId: goalId ?? undefined }),
    onMutate: async ({ habitId, goalId }) => {
      const snaps = await snapshotQueries<HabitsListResponse>(qc, habitsQueries.lists())
      patchQueries<HabitsListResponse>(qc, habitsQueries.lists(), (cur) => ({
        ...cur,
        data: listOps.patch(cur.data, habitId, { goalId: goalId ?? undefined } as unknown as Partial<Habit>),
      }))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: habitsQueries.all() }),
  })
}
