import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { useStartTimer, useStopTimer } from '../queries'
import type { Task } from '@repo/shared/types'

interface TaskTimerButtonProps {
  task: Task
}

export function TaskTimerButton({ task }: TaskTimerButtonProps) {
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
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
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRunning) {
      stopTimer.mutate(task.id)
    } else {
      startTimer.mutate(task.id)
    }
  }

  if (task.status === 'completed') return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={startTimer.isPending || stopTimer.isPending}
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
