import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { pomodoroApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type { PomodoroSession } from '@repo/shared/types'
import type { CreatePomodoroSessionInput, UpdatePomodoroSessionInput } from '@repo/shared/validators'
import { listOps, patchQueries, rollbackQueries, snapshotQueries } from '@/shared/lib/optimistic'
import { playSound } from '@/shared/lib/sound'

interface SessionsResponse { data: PomodoroSession[]; count: number }

export const pomodoroQueries = {
  all: () => ['pomodoro'] as const,
  sessionsAll: () => [...pomodoroQueries.all(), 'sessions'] as const,

  sessions: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...pomodoroQueries.sessionsAll(), params],
      queryFn: () => pomodoroApi.listSessions(params),
      staleTime: CACHE_TIMES.standard,
    }),

  stats: () =>
    queryOptions({
      queryKey: [...pomodoroQueries.all(), 'stats'],
      queryFn: () => pomodoroApi.getStats(),
      staleTime: CACHE_TIMES.short,
    }),
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePomodoroSessionInput) => pomodoroApi.createSession(data),
    onSuccess: () => {
      playSound('pomodoroStart')
      queryClient.invalidateQueries({ queryKey: pomodoroQueries.all() })
    },
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePomodoroSessionInput }) =>
      pomodoroApi.updateSession(id, data),
    onMutate: async ({ id, data }) => {
      const snaps = await snapshotQueries<SessionsResponse>(qc, pomodoroQueries.sessionsAll())
      patchQueries<SessionsResponse>(qc, pomodoroQueries.sessionsAll(), (cur) => ({
        ...cur,
        data: listOps.patch(cur.data, id, data as Partial<PomodoroSession>),
      }))
      return { snaps }
    },
    onSuccess: (_res, vars) => {
      const status = (vars.data as { status?: string })?.status
      if (status === 'completed' || status === 'cancelled') playSound('pomodoroEnd')
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pomodoroQueries.all() }),
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pomodoroApi.deleteSession(id),
    onMutate: async (id) => {
      const snaps = await snapshotQueries<SessionsResponse>(qc, pomodoroQueries.sessionsAll())
      patchQueries<SessionsResponse>(qc, pomodoroQueries.sessionsAll(), (cur) => ({
        ...cur,
        data: listOps.remove(cur.data, id),
        count: Math.max(0, cur.count - 1),
      }))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pomodoroQueries.all() }),
  })
}
