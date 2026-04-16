import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { usePomodoroStore } from '@/shared/stores/pomodoro.store'
import { Timer, Pause, Play } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

const MODE_COLORS: Record<string, string> = {
  focus: 'text-primary',
  short_break: 'text-emerald-500',
  long_break: 'text-amber-500',
}

export function PomodoroMiniTimer() {
  const { mode, timeLeft, isRunning, activeSessionId, tick, setIsRunning } = usePomodoroStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Global tick — runs as long as isRunning is true, regardless of which page is active
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft, tick])

  // Don't render if no active session
  if (!activeSessionId) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const color = MODE_COLORS[mode] || 'text-primary'

  return (
    <Link
      to="/pomodoro"
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 transition-colors hover:bg-muted"
    >
      <Timer className={cn('h-4 w-4', color)} />
      <span className={cn('text-sm font-mono font-semibold tabular-nums', color)}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsRunning(!isRunning)
        }}
      >
        {isRunning ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>
    </Link>
  )
}
