import { useEffect, useMemo, useState } from 'react'
import type { Task } from '@repo/shared/types'

function computeElapsedSeconds(task: Task | null | undefined): number {
  if (!task) return 0
  const prev = task.actualDurationSeconds ?? 0
  if (!task.actualStart || task.actualEnd) return prev
  const started = new Date(task.actualStart).getTime()
  return prev + Math.floor((Date.now() - started) / 1000)
}

export function useFocusTimer(task: Task | null | undefined, isRunning: boolean) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isRunning])

  return useMemo(() => {
    void now
    return computeElapsedSeconds(task) * 1000
  }, [task, now])
}
