import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recurringApi, type RecurringInput, type RecurringSeries } from './api'
import { listOps, patchQueries, rollbackQueries, snapshotQueries } from '@/shared/lib/optimistic'

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
    onMutate: async ({ id, body }) => {
      const snaps = await snapshotQueries<RecurringSeries[]>(qc, keys.list)
      patchQueries<RecurringSeries[]>(qc, keys.list, (cur) =>
        listOps.patch(cur, id, body as Partial<RecurringSeries>),
      )
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.list }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onMutate: async (id) => {
      const snaps = await snapshotQueries<RecurringSeries[]>(qc, keys.list)
      patchQueries<RecurringSeries[]>(qc, keys.list, (cur) => listOps.remove(cur, id))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.list }),
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
