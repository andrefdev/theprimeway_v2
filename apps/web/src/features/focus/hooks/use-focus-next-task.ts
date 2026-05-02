import { useCallback } from 'react'
import { tasksApi } from '@/features/tasks/api'
import { workingSessionsApi } from '@/features/scheduling/working-sessions-api'
import type { Task } from '@repo/shared/types'

const LOOKAHEAD_HOURS = 36

export function useFocusNextTask() {
  return useCallback(async (excludeTaskId: string): Promise<Task | null> => {
    const now = new Date()
    const horizon = new Date(now.getTime() + LOOKAHEAD_HOURS * 60 * 60 * 1000)

    const sessions = await workingSessionsApi.list({
      from: now.toISOString(),
      to: horizon.toISOString(),
    })

    const cutoff = now.getTime() - 5 * 60 * 1000
    const candidate = [...sessions]
      .filter((s) => s.taskId && s.taskId !== excludeTaskId)
      .filter((s) => new Date(s.end).getTime() >= cutoff)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0]

    if (!candidate?.taskId) return null

    const res = await tasksApi.get(candidate.taskId)
    return res.data as Task
  }, [])
}
