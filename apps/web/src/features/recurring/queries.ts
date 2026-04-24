import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recurringApi, type RecurringInput } from './api'

const keys = {
  list: ['recurring-series', 'list'] as const,
}

export function useRecurringList() {
  return useQuery({ queryKey: keys.list, queryFn: recurringApi.list, staleTime: 30_000 })
}

export function useCreateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RecurringInput) => recurringApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list }),
  })
}

export function useUpdateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<RecurringInput> }) => recurringApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list }),
  })
}

export function useMaterializeRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => recurringApi.materialize(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: keys.list })
    },
  })
}
