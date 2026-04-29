import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { notificationsApi } from './api'
import type { InboxResponse } from './api'
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

function invalidateAll(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: notificationQueries.all() })
}

function inboxQueriesSnapshot(qc: QueryClient) {
  return qc.getQueriesData<InboxResponse>({
    queryKey: [...notificationQueries.all(), 'inbox'],
  })
}

function patchInboxQueries(
  qc: QueryClient,
  updater: (cur: InboxResponse) => InboxResponse,
) {
  const snapshots = inboxQueriesSnapshot(qc)
  for (const [key, value] of snapshots) {
    if (!value) continue
    qc.setQueryData<InboxResponse>(key, updater(value))
  }
  return snapshots
}

function rollbackInboxQueries(
  qc: QueryClient,
  snapshots: ReadonlyArray<readonly [readonly unknown[], InboxResponse | undefined]>,
) {
  for (const [key, value] of snapshots) {
    qc.setQueryData(key, value)
  }
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationQueries.all() })
      const now = new Date().toISOString()
      const snapshots = patchInboxQueries(qc, (cur) => {
        let unreadDelta = 0
        const next = cur.data.map((n) => {
          if (n.id !== id) return n
          if (!n.readAt) unreadDelta = 1
          return { ...n, readAt: now }
        })
        return { ...cur, data: next, unread: Math.max(0, cur.unread - unreadDelta) }
      })
      return { snapshots }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshots) rollbackInboxQueries(qc, ctx.snapshots)
    },
    onSettled: () => invalidateAll(qc),
  })
}

export function useDismissNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dismiss(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationQueries.all() })
      const snapshots = patchInboxQueries(qc, (cur) => {
        const target = cur.data.find((n) => n.id === id)
        const wasUnread = target ? !target.readAt : false
        const data = cur.data.filter((n) => n.id !== id)
        return {
          ...cur,
          data,
          count: Math.max(0, cur.count - (target ? 1 : 0)),
          unread: Math.max(0, cur.unread - (wasUnread ? 1 : 0)),
        }
      })
      return { snapshots }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshots) rollbackInboxQueries(qc, ctx.snapshots)
    },
    onSettled: () => invalidateAll(qc),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationQueries.all() })
      const snapshots = patchInboxQueries(qc, (cur) => {
        const target = cur.data.find((n) => n.id === id)
        const wasUnread = target ? !target.readAt : false
        return {
          ...cur,
          data: cur.data.filter((n) => n.id !== id),
          count: Math.max(0, cur.count - (target ? 1 : 0)),
          unread: Math.max(0, cur.unread - (wasUnread ? 1 : 0)),
        }
      })
      return { snapshots }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshots) rollbackInboxQueries(qc, ctx.snapshots)
    },
    onSettled: () => invalidateAll(qc),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationQueries.all() })
      const now = new Date().toISOString()
      const snapshots = patchInboxQueries(qc, (cur) => ({
        ...cur,
        data: cur.data.map((n) => (n.readAt ? n : { ...n, readAt: now })),
        unread: 0,
      }))
      return { snapshots }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshots) rollbackInboxQueries(qc, ctx.snapshots)
    },
    onSettled: () => invalidateAll(qc),
  })
}

export function useDismissAllNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.dismissAll(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationQueries.all() })
      const snapshots = patchInboxQueries(qc, (cur) => ({
        ...cur,
        data: [],
        count: 0,
        unread: 0,
      }))
      return { snapshots }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshots) rollbackInboxQueries(qc, ctx.snapshots)
    },
    onSettled: () => invalidateAll(qc),
  })
}
