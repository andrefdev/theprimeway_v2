import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { pomodoroApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type { CreatePomodoroSessionInput, UpdatePomodoroSessionInput } from '@repo/shared/validators'

export const pomodoroQueries = {
  all: () => ['pomodoro'] as const,

  sessions: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...pomodoroQueries.all(), 'sessions', params],
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pomodoroQueries.all() }),
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePomodoroSessionInput }) =>
      pomodoroApi.updateSession(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pomodoroQueries.all() }),
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pomodoroApi.deleteSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pomodoroQueries.all() }),
  })
}
