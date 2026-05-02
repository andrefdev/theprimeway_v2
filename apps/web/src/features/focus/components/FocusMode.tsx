import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { X } from 'lucide-react'
import { useFocusStore } from '../focus-store'
import { useFocusTask } from '../hooks/use-focus-task'
import { useFocusTimer } from '../hooks/use-focus-timer'
import { useFocusActions } from '../hooks/use-focus-actions'
import { useFocusKeyboard } from '../hooks/use-focus-keyboard'
import { FocusPreflight } from './FocusPreflight'
import { FocusRunning } from './FocusRunning'

type Phase = 'preflight' | 'running' | 'paused'

export function FocusMode() {
  const { open, taskId, close } = useFocusStore()

  const taskQuery = useFocusTask(taskId, open)
  const task = taskQuery.data ?? null

  const [phase, setPhase] = useState<Phase>('preflight')
  const [acceptance, setAcceptance] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)

  // Sync local state from task whenever taskId changes or task data hydrates
  useEffect(() => {
    if (!open || !task) return
    setAcceptance(task.acceptanceCriteria ?? '')
    setDurationMinutes(task.estimatedDuration ?? null)
    if (task.actualStart && !task.actualEnd) {
      setPhase('running')
    } else {
      setPhase('preflight')
    }
  }, [open, taskId, task?.actualStart, task?.actualEnd])

  // Reset transient fields when modal closes
  useEffect(() => {
    if (!open) {
      setPhase('preflight')
      setAcceptance('')
      setDurationMinutes(null)
    }
  }, [open])

  const elapsedMs = useFocusTimer(task, phase === 'running')
  const targetMs = durationMinutes ? durationMinutes * 60_000 : null
  const over = targetMs != null && elapsedMs > targetMs

  const actions = useFocusActions({
    taskId,
    task,
    acceptance,
    durationMinutes,
    onStarted: () => setPhase('running'),
    onPaused: () => setPhase('paused'),
    onResumed: () => setPhase('running'),
    onClose: close,
  })

  useFocusKeyboard({
    enabled: open && (phase === 'running' || phase === 'paused'),
    onTogglePlay: () => (phase === 'running' ? actions.pause() : actions.resume()),
    onComplete: () => actions.complete(over),
    onClose: close,
  })

  if (!open || !taskId) return null

  const title = task?.title ?? 'Focus'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Focus mode</div>
        <Button variant="ghost" size="sm" onClick={close} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {phase === 'preflight' ? (
          <FocusPreflight
            taskId={taskId}
            title={title}
            acceptance={acceptance}
            setAcceptance={setAcceptance}
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            onStart={actions.start}
            onCancel={close}
            isStarting={actions.isStarting}
          />
        ) : (
          <FocusRunning
            taskId={taskId}
            title={title}
            acceptance={acceptance}
            phase={phase}
            elapsedMs={elapsedMs}
            targetMs={targetMs}
            over={over}
            onPause={actions.pause}
            onResume={actions.resume}
            onComplete={() => actions.complete(over)}
            onClose={close}
            isPausing={actions.isPausing}
            isStarting={actions.isStarting}
            isCompleting={actions.isCompleting}
          />
        )}
      </div>
    </div>
  )
}
