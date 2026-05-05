import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { CACHE_TIMES } from '@repo/shared/constants'
import { aiApi, type ChatThreadSummary } from './api'

export const aiQueries = {
  all: () => ['ai'] as const,

  threads: () =>
    queryOptions({
      queryKey: [...aiQueries.all(), 'threads'] as const,
      queryFn: () => aiApi.listThreads(),
      staleTime: CACHE_TIMES.standard,
    }),

  thread: (id: string | undefined) =>
    queryOptions({
      queryKey: [...aiQueries.all(), 'thread', id] as const,
      queryFn: () => aiApi.getThread(id!),
      staleTime: CACHE_TIMES.standard,
      enabled: !!id,
    }),
}

export function useRenameThreadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => aiApi.renameThread(id, title),
    onMutate: ({ id, title }) => {
      const key = [...aiQueries.all(), 'threads'] as const
      const prev = qc.getQueryData<ChatThreadSummary[]>(key)
      if (prev) {
        qc.setQueryData<ChatThreadSummary[]>(
          key,
          prev.map((t) => (t.id === id ? { ...t, title } : t)),
        )
      }
      return { prev, key }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [...aiQueries.all(), 'threads'] }),
  })
}

export function useDeleteThreadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteThread(id),
    onMutate: (id) => {
      const key = [...aiQueries.all(), 'threads'] as const
      const prev = qc.getQueryData<ChatThreadSummary[]>(key)
      if (prev) {
        qc.setQueryData<ChatThreadSummary[]>(
          key,
          prev.filter((t) => t.id !== id),
        )
      }
      return { prev, key }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: aiQueries.all() }),
  })
}

export function useDeleteAllThreadsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => aiApi.deleteAllThreads(),
    onMutate: () => {
      const key = [...aiQueries.all(), 'threads'] as const
      const prev = qc.getQueryData<ChatThreadSummary[]>(key)
      qc.setQueryData<ChatThreadSummary[]>(key, [])
      return { prev, key }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: aiQueries.all() }),
  })
}
