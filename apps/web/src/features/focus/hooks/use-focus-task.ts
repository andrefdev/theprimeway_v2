import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/features/tasks/api'
import type { Task } from '@repo/shared/types'

export function useFocusTask(taskId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['tasks', 'focus', taskId],
    queryFn: () => tasksApi.get(taskId!).then((r) => r.data as Task),
    enabled: !!taskId && enabled,
    staleTime: 5_000,
    refetchInterval: 30_000,
  })
}
