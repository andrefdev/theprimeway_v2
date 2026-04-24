import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subtasksApi, type Subtask } from './api'

export const subtasksKeys = {
  byTask: (taskId: string) => ['subtasks', 'task', taskId] as const,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: subtasksKeys.byTask(taskId) }),
  })
}

export function useUpdateSubtask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ title: string; isCompleted: boolean; plannedTimeMinutes: number | null; position: number }> }) =>
      subtasksApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: subtasksKeys.byTask(taskId) })
      const prev = qc.getQueryData<Subtask[]>(subtasksKeys.byTask(taskId))
      if (prev) {
        qc.setQueryData<Subtask[]>(
          subtasksKeys.byTask(taskId),
          prev.map((s) => (s.id === id ? { ...s, ...input } as Subtask : s)),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(subtasksKeys.byTask(taskId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: subtasksKeys.byTask(taskId) }),
  })
}

export function useDeleteSubtask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subtasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: subtasksKeys.byTask(taskId) }),
  })
}
