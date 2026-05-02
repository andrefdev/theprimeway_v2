import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '@repo/shared/types'
import { useFocusStore } from '../focus-store'

export function useFocusStart() {
  const qc = useQueryClient()
  const start = useFocusStore((s) => s.start)
  return useCallback(
    (task: Task) => {
      qc.setQueryData(['tasks', 'focus', task.id], task)
      start(task.id)
    },
    [qc, start],
  )
}
