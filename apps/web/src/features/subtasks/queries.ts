import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subtasksApi, type Subtask } from './api'
import { listOps, patchQueries, rollbackQueries, snapshotQueries } from '@/shared/lib/optimistic'

export const subtasksKeys = {
  byTask: (taskId: string) => ['subtasks', 'task', taskId] as const,
}

function tempSubtaskId() {
  return `subtask-tmp-${Math.random().toString(36).slice(2, 10)}`
}

export function useSubtasks(taskId: string | null | undefined) {
  return useQuery({
    queryKey: taskId ? subtasksKeys.byTask(taskId) : ['subtasks', 'none'],
    queryFn: () => subtasksApi.list(taskId!),
    enabled: !!taskId,
    staleTime: 10_000,
  })
}

export function useCreateSubtask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; plannedTimeMinutes?: number }) => subtasksApi.create(taskId, input),
    onMutate: async (input) => {
      const snaps = await snapshotQueries<Subtask[]>(qc, subtasksKeys.byTask(taskId))
      const now = new Date().toISOString()
      const optimistic: Subtask = {
        id: tempSubtaskId(),
        taskId,
        title: input.title,
        isCompleted: false,
        plannedTimeMinutes: input.plannedTimeMinutes ?? null,
        actualTimeMinutes: 0,
        position: 9999,
        createdAt: now,
        updatedAt: now,
      }
      patchQueries<Subtask[]>(qc, subtasksKeys.byTask(taskId), (cur) => [...cur, optimistic])
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: subtasksKeys.byTask(taskId) }),
  })
}

export function useUpdateSubtask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ title: string; isCompleted: boolean; plannedTimeMinutes: number | null; position: number }> }) =>
      subtasksApi.update(id, input),
    onMutate: async ({ id, input }) => {
      const snaps = await snapshotQueries<Subtask[]>(qc, subtasksKeys.byTask(taskId))
      patchQueries<Subtask[]>(qc, subtasksKeys.byTask(taskId), (cur) =>
        listOps.patch(cur, id, input as Partial<Subtask>),
      )
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: subtasksKeys.byTask(taskId) }),
  })
}

export function useDeleteSubtask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subtasksApi.delete(id),
    onMutate: async (id) => {
      const snaps = await snapshotQueries<Subtask[]>(qc, subtasksKeys.byTask(taskId))
      patchQueries<Subtask[]>(qc, subtasksKeys.byTask(taskId), (cur) => listOps.remove(cur, id))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: subtasksKeys.byTask(taskId) }),
  })
}
