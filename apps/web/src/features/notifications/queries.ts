import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const notificationQueries = {
  all: () => ['notifications'] as const,

  preferences: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'preferences'],
      queryFn: () => notificationsApi.getPreferences(),
      staleTime: CACHE_TIMES.standard,
    }),

  aggregated: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'aggregated'],
      queryFn: () => notificationsApi.getAggregated(),
      staleTime: 2 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
    }),

  smartReminders: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'smart-reminders'],
      queryFn: () => notificationsApi.getSmartReminders(),
      staleTime: 5 * 60 * 1000,
    }),

  batched: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'batched'],
      queryFn: () => notificationsApi.getBatched(),
      staleTime: 2 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
    }),

  inbox: (opts?: { includeRead?: boolean; includeDismissed?: boolean }) =>
    queryOptions({
      queryKey: [...notificationQueries.all(), 'inbox', opts ?? {}],
      queryFn: () => notificationsApi.getInbox({ ...opts, limit: 100 }),
      staleTime: 60 * 1000,
      refetchInterval: 60 * 1000,
    }),
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: notificationQueries.all() })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDismissNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dismiss(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDismissAllNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.dismissAll(),
    onSuccess: () => invalidateAll(qc),
  })
}
