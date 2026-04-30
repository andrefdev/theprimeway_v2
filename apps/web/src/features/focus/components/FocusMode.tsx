import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { X, Pause, Play, Check, LogOut } from 'lucide-react'
import { useFocusStore } from '../focus-store'
import { useFocusTask } from '../hooks/use-focus-task'
import { useFocusTimer } from '../hooks/use-focus-timer'
import { useFocusActions } from '../hooks/use-focus-actions'
import { useFocusKeyboard } from '../hooks/use-focus-keyboard'
import { VisionThreadChip } from '@/features/vision/components/VisionThreadChip'
import { FocusSubtasksPanel } from './FocusSubtasksPanel'

type Phase = 'preflight' | 'running' | 'paused' | 'completed'

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const PRESET_DURATIONS = [15, 25, 45, 60, 90]

export function FocusMode() {
  const { open, taskId, close } = useFocusStore()

  const taskQuery = useFocusTask(taskId, open)
  const task = taskQuery.data ?? null

  const [phase, setPhase] = useState<Phase>('preflight')
  const [acceptance, setAcceptance] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [nextStep, setNextStep] = useState('')

  // Sync from task on open / when timer state changes
  useEffect(() => {
    if (!open || !task) return
    setAcceptance(task.acceptanceCriteria ?? '')
    setDurationMinutes(task.plannedTimeMinutes ?? task.estimatedDuration ?? null)
    if (task.actualStart && !task.actualEnd) {
      setPhase('running')
    } else if (phase !== 'completed') {
      setPhase('preflight')
    }
    setNextStep('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId, task?.actualStart, task?.actualEnd])

  // Reset transient fields when modal closes
  useEffect(() => {
    if (!open) {
      setPhase('preflight')
      setAcceptance('')
      setDurationMinutes(null)
      setNextStep('')
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
    onCompleted: () => setPhase('completed'),
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
        {phase === 'completed' ? (
          <div className="max-w-xl w-full space-y-6">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Task complete</div>
              <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">Nicely done. One last thought.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">What's the smallest next step?</Label>
              <Input
                autoFocus
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !actions.savingNextStep) {
                    e.preventDefault()
                    actions.saveNextStep(nextStep)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    close()
                  }
                }}
                placeholder="e.g. Send the draft to Ana for review"
              />
              <div className="text-xs text-muted-foreground">
                Added to backlog. Leave empty to skip.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={close} disabled={actions.savingNextStep}>Skip</Button>
              <Button onClick={() => actions.saveNextStep(nextStep)} disabled={actions.savingNextStep}>
                {actions.savingNextStep ? 'Saving…' : nextStep.trim() ? 'Add next step' : 'Done'}
              </Button>
            </div>
          </div>
        ) : phase === 'preflight' ? (
          <div className="max-w-xl w-full space-y-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">About to focus on</div>
              <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
              {taskId && <VisionThreadChip taskId={taskId} />}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">What does done look like?</Label>
              <Textarea
                autoFocus
                rows={2}
                value={acceptance}
                onChange={(e) => setAcceptance(e.target.value)}
                placeholder="e.g. First draft written, skeleton PR opened, etc."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">How long do you actually need?</Label>
              <div className="flex items-center gap-2 text-sm">
                {PRESET_DURATIONS.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={durationMinutes === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDurationMinutes(m)}
                  >
                    {m}m
                  </Button>
                ))}
                <Input
                  type="number"
                  min={1}
                  max={480}
                  placeholder="custom"
                  value={durationMinutes && !PRESET_DURATIONS.includes(durationMinutes) ? durationMinutes : ''}
                  onChange={(e) =>
                    setDurationMinutes(e.target.value ? Math.min(480, Math.max(1, Number(e.target.value))) : null)
                  }
                  className="w-20"
                />
                <span className="text-muted-foreground">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={actions.start} disabled={actions.isStarting}>
                {actions.isStarting ? 'Starting…' : 'Start focus'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl flex items-start gap-8">
            <div className="hidden md:block pt-4">{taskId && <FocusSubtasksPanel taskId={taskId} />}</div>
            <div className="flex-1 text-center space-y-10">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {phase === 'paused' ? 'Paused' : over ? 'Overtime' : 'In focus'}
              </div>
              <div
                className={`font-mono tabular-nums leading-none select-none ${
                  over ? 'text-rose-500' : phase === 'paused' ? 'text-muted-foreground' : 'text-foreground'
                }`}
                style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}
              >
                {formatDuration(elapsedMs)}
              </div>
              {targetMs != null && (
                <div className="text-sm text-muted-foreground">
                  target {Math.round(targetMs / 60_000)}m
                  {over && ` · +${Math.round((elapsedMs - targetMs) / 60_000)}m over`}
                </div>
              )}

              <div>
                <h2 className="text-xl font-medium">{title}</h2>
                {taskId && <div className="mt-1"><VisionThreadChip taskId={taskId} /></div>}
                {acceptance && (
                  <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
                    <span className="font-medium text-foreground">Done means:</span> {acceptance}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                {phase === 'running' ? (
                  <Button variant="outline" onClick={actions.pause} disabled={actions.isPausing}>
                    <Pause className="h-4 w-4 mr-1" /> Pause
                  </Button>
                ) : (
                  <Button variant="outline" onClick={actions.resume} disabled={actions.isStarting}>
                    <Play className="h-4 w-4 mr-1" /> Resume
                  </Button>
                )}
                <Button onClick={() => actions.complete(over)}>
                  <Check className="h-4 w-4 mr-1" /> Complete
                </Button>
                <Button variant="ghost" onClick={close}>
                  <LogOut className="h-4 w-4 mr-1" /> Exit (keep timer)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
