import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Timer, Square, ExternalLink, Check } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { tasksQueries } from '../queries'
import { useStopTimer, useUpdateTask } from '../queries'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import type { Task } from '@repo/shared/types'

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

function computeElapsed(task: Task): number {
  if (!task.actualStart) return task.actualDurationSeconds ?? 0
  if (task.actualEnd) return task.actualDurationSeconds ?? 0
  const started = new Date(task.actualStart).getTime()
  const prev = task.actualDurationSeconds ?? 0
  return prev + Math.floor((Date.now() - started) / 1000)
}

export function ActiveTaskHeaderBadge() {
  const { t } = useTranslation('tasks')
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const tasksQuery = useQuery({
    ...tasksQueries.list(),
    refetchInterval: 60_000,
  })

  const activeTask = useMemo<Task | null>(() => {
    const list = tasksQuery.data?.data ?? []
    return list.find((x) => !!x.actualStart && !x.actualEnd) ?? null
  }, [tasksQuery.data])

  useEffect(() => {
    if (!activeTask) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeTask])

  useEffect(() => {
    if (!activeTask) return
    const originalTitle = document.title
    const baseTitle = originalTitle.replace(/^⏱\s[^·]+·\s/, '')
    const update = () => {
      const secs = computeElapsed(activeTask)
      document.title = `⏱ ${formatElapsed(secs)} · ${activeTask.title} — ${baseTitle}`
    }
    update()
    const id = setInterval(update, 1000)
    return () => {
      clearInterval(id)
      document.title = baseTitle
    }
  }, [activeTask])

  const stopTimer = useStopTimer()
  const updateTask = useUpdateTask()

  if (!activeTask) return null

  const elapsed = computeElapsed({ ...activeTask, actualStart: activeTask.actualStart, actualEnd: activeTask.actualEnd, actualDurationSeconds: activeTask.actualDurationSeconds })
  // Keep `now` referenced so the display re-renders each second
  void now

  const handleStop = async () => {
    try {
      await stopTimer.mutateAsync(activeTask.id)
      setOpen(false)
    } catch {
      // noop
    }
  }

  const handleComplete = async () => {
    try {
      if (activeTask.actualStart && !activeTask.actualEnd) {
        await stopTimer.mutateAsync(activeTask.id)
      }
      await updateTask.mutateAsync({ id: activeTask.id, data: { status: 'completed' } })
      setOpen(false)
    } catch {
      // noop
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 transition-colors hover:bg-muted',
          'max-w-[220px]',
        )}
        title={activeTask.title}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <Timer className="h-4 w-4 shrink-0 text-red-500" />
        <span className="truncate text-xs text-muted-foreground">
          {activeTask.title}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-red-500">
          {formatElapsed(elapsed)}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-red-500" />
              {t('timerRunning', { defaultValue: 'Timer running' })}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-full text-center px-2 min-w-0">
              <h2 className="text-lg font-semibold text-foreground break-words line-clamp-4">
                {activeTask.title}
              </h2>
              {activeTask.description && (
                <p className="mt-1 text-sm text-muted-foreground break-words line-clamp-3">
                  {activeTask.description}
                </p>
              )}
            </div>

            <div className="font-mono text-6xl font-bold tabular-nums text-red-500">
              {formatElapsed(elapsed)}
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {activeTask.priority && (
                <Badge variant="secondary">
                  {t(`priority.${activeTask.priority}`, { defaultValue: activeTask.priority })}
                </Badge>
              )}
              {activeTask.dueDate && (
                <Badge variant="outline">
                  {t('due', { defaultValue: 'Due' })}:{' '}
                  {new Date(activeTask.dueDate).toLocaleDateString()}
                </Badge>
              )}
              {activeTask.estimatedDuration != null && (
                <Badge variant="outline">
                  {t('estimated', { defaultValue: 'Estimated' })}:{' '}
                  {activeTask.estimatedDuration}m
                </Badge>
              )}
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={stopTimer.isPending || updateTask.isPending}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                {t('stopTimer', { defaultValue: 'Stop timer' })}
              </Button>
              <Button
                variant="default"
                onClick={handleComplete}
                disabled={stopTimer.isPending || updateTask.isPending}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {t('markComplete', { defaultValue: 'Mark complete' })}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/tasks" onClick={() => setOpen(false)} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {t('openTasks', { defaultValue: 'Open tasks' })}
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
