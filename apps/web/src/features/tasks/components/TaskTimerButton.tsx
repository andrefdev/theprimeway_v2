import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { useStopTimer } from '../queries'
import { useFocusStart } from '@/features/focus/hooks/use-focus-start'
import type { Task } from '@repo/shared/types'

interface TaskTimerButtonProps {
  task: Task
}

export function TaskTimerButton({ task }: TaskTimerButtonProps) {
  const stopTimer = useStopTimer()
  const startFocus = useFocusStart()
  const isRunning = !!task.actualStart && !task.actualEnd
  const [elapsed, setElapsed] = useState(0)

  // Calculate elapsed from actualStart
  const getElapsed = useCallback(() => {
    if (!task.actualStart || task.actualEnd) return task.actualDurationSeconds ?? 0
    const started = new Date(task.actualStart).getTime()
    const prev = task.actualDurationSeconds ?? 0
    return prev + Math.floor((Date.now() - started) / 1000)
  }, [task.actualStart, task.actualEnd, task.actualDurationSeconds])

  useEffect(() => {
    setElapsed(getElapsed())
    if (!isRunning) return
    const interval = setInterval(() => setElapsed(getElapsed()), 1000)
    return () => clearInterval(interval)
  }, [isRunning, getElapsed])

  const formatTime = (secs: number) => {
    if (secs >= 3600) return `${Math.floor(secs / 3600)}h`
    if (secs >= 600) return `${Math.floor(secs / 60)}m`
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRunning) {
      stopTimer.mutate(task.id)
    } else {
      startFocus(task)
    }
  }

  if (task.status === 'completed') return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={stopTimer.isPending}
      className="h-7 gap-1 px-2 text-xs"
    >
      {isRunning ? (
        <>
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono">{formatTime(elapsed)}</span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">&#9654;</span>
          {elapsed > 0 && <span className="font-mono text-muted-foreground">{formatTime(elapsed)}</span>}
        </>
      )}
    </Button>
  )
}
