import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { channelsApi, type ContextInput, type ChannelInput } from './api'

export const channelsKeys = {
  contexts: ['channels', 'contexts'] as const,
  channels: ['channels', 'list'] as const,
}

export function useContexts() {
  return useQuery({ queryKey: channelsKeys.contexts, queryFn: channelsApi.listContexts, staleTime: 30_000 })
}

export function useChannels() {
  return useQuery({ queryKey: channelsKeys.channels, queryFn: channelsApi.list, staleTime: 30_000 })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: channelsKeys.contexts })
  qc.invalidateQueries({ queryKey: channelsKeys.channels })
}

export function useCreateContext() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (body: ContextInput) => channelsApi.createContext(body), onSuccess: () => invalidateAll(qc) })
}
export function useUpdateContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ContextInput> }) => channelsApi.updateContext(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export function useDeleteContext() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => channelsApi.deleteContext(id), onSuccess: () => invalidateAll(qc) })
}

export function useCreateChannel() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (body: ChannelInput) => channelsApi.create(body), onSuccess: () => invalidateAll(qc) })
}
export function useUpdateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ChannelInput> }) => channelsApi.update(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => channelsApi.delete(id), onSuccess: () => invalidateAll(qc) })
}
export function useSeedDefaults() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => channelsApi.seedDefaults(), onSuccess: () => invalidateAll(qc) })
}
