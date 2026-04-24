import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { brainApi } from './api'
import type { BrainEntry } from '@repo/shared/types'

const ACTIVE_STATUSES = new Set(['pending', 'transcribing', 'analyzing'])

export const brainKeys = {
  feed: (params: { status?: string; search?: string } = {}) => ['brain', 'feed', params] as const,
  entry: (id: string) => ['brain', 'entry', id] as const,
}

export function useBrainFeed(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: brainKeys.feed(params),
    queryFn: () => brainApi.list(params),
    staleTime: 10_000,
    // Keep feed fresh while any entry is still processing.
    refetchInterval: (q) => {
      const data = q.state.data as BrainEntry[] | undefined
      return data?.some((e) => ACTIVE_STATUSES.has(e.status)) ? 3000 : false
    },
  })
}

export function useBrainEntry(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? brainKeys.entry(id) : ['brain', 'entry', 'none'],
    queryFn: () => brainApi.get(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data as BrainEntry | undefined
      return data && ACTIVE_STATUSES.has(data.status) ? 2000 : false
    },
  })
}

export function useCreateBrainEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => brainApi.create(content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brain', 'feed'] })
    },
  })
}

export function useReprocessBrainEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => brainApi.reprocess(id),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ['brain', 'feed'] })
      qc.invalidateQueries({ queryKey: brainKeys.entry(entry.id) })
    },
  })
}

export function useDeleteBrainEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => brainApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brain', 'feed'] }),
  })
}

export function useApplyActionItem(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (index: number) => brainApi.applyActionItem(entryId, index),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brainKeys.entry(entryId) })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateBrainEntry(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<{ userTitle: string; topics: string[]; isPinned: boolean; isArchived: boolean }>) =>
      brainApi.userUpdate(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brainKeys.entry(id) })
      qc.invalidateQueries({ queryKey: ['brain', 'feed'] })
    },
  })
}
