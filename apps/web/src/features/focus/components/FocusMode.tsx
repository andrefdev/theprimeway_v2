import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { X, Pause, Play, Check, LogOut, Timer } from 'lucide-react'
import { useFocusStore } from '../focus-store'
import { tasksApi } from '@/features/tasks/api'
import { schedulingApi } from '@/features/scheduling/api'
import { schedulingKeys } from '@/features/scheduling/queries'
import { useStartTimer } from '@/features/tasks/queries'
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

export function FocusMode() {
  const { open, taskId, close, acceptance, setAcceptance, durationMinutes, setDurationMinutes } = useFocusStore()

  const taskQuery = useQuery({
    queryKey: ['tasks', 'focus', taskId],
    queryFn: () => tasksApi.get(taskId!).then((r) => r.data),
    enabled: !!taskId && open,
    staleTime: 10_000,
  })

  const [phase, setPhase] = useState<Phase>('preflight')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pausedAccumulated, setPausedAccumulated] = useState(0)
  const [nextStep, setNextStep] = useState('')
  const [savingNextStep, setSavingNextStep] = useState(false)
  const startRef = useRef<number | null>(null)
  const pauseStartRef = useRef<number | null>(null)
  const qc = useQueryClient()
  const startBackendTimer = useStartTimer()

  // Reset every time we open a new focus session
  useEffect(() => {
    if (open) {
      setPhase('preflight')
      setElapsedMs(0)
      setPausedAccumulated(0)
      setNextStep('')
      setSavingNextStep(false)
      startRef.current = null
      pauseStartRef.current = null
    }
  }, [open, taskId])

  // Ticker
  useEffect(() => {
    if (phase !== 'running' || !startRef.current) return
    const id = setInterval(() => {
      if (startRef.current) {
        setElapsedMs(Date.now() - startRef.current - pausedAccumulated)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [phase, pausedAccumulated])

  const targetMs = useMemo(() => {
    const mins = durationMinutes ?? (taskQuery.data as any)?.plannedTimeMinutes ?? (taskQuery.data as any)?.estimatedDurationMinutes ?? null
    return mins ? mins * 60_000 : null
  }, [durationMinutes, taskQuery.data])

  const over = targetMs != null && elapsedMs > targetMs

  async function start() {
    if (!taskId) return
    startRef.current = Date.now()
    setPhase('running')
    // Fire timer-start (enables late-timer detector)
    schedulingApi.timerStart({ taskId }).catch(() => undefined)
  }

  function pause() {
    if (phase !== 'running') return
    pauseStartRef.current = Date.now()
    setPhase('paused')
  }

  function resume() {
    if (phase !== 'paused' || !pauseStartRef.current) return
    setPausedAccumulated((acc) => acc + (Date.now() - (pauseStartRef.current ?? Date.now())))
    pauseStartRef.current = null
    setPhase('running')
  }

  async function complete() {
    if (!taskId) return
    try {
      await tasksApi.update(taskId, { status: 'completed' } as any)
      await schedulingApi.completeEarly({ taskId }).catch(() => undefined)
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      toast.success(over ? 'Completed (overtime)' : 'Task completed')
      setPhase('completed')
    } catch (err) {
      toast.error((err as Error).message || 'Complete failed')
    }
  }

  async function saveNextStep() {
    const title = nextStep.trim()
    if (!title) {
      close()
      return
    }
    setSavingNextStep(true)
    try {
      await tasksApi.create({ title } as any)
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Next step added to backlog')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add next step')
    } finally {
      setSavingNextStep(false)
      close()
    }
  }

  function cutShort() {
    close()
  }

  async function switchToTimerBar() {
    if (!taskId) return
    try {
      await startBackendTimer.mutateAsync(taskId)
      toast.success('Timer running in top bar')
      close()
    } catch (err) {
      toast.error((err as Error).message || 'Could not start timer')
    }
  }

  // Keyboard: Space = pause/resume, Enter = complete, Esc = cut short. Only when running/paused.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (phase === 'preflight' || phase === 'completed') return
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return
      if (e.key === ' ') {
        e.preventDefault()
        phase === 'running' ? pause() : resume()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        complete()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cutShort()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase])

  if (!open || !taskId) return null

  const task = taskQuery.data as any
  const title = task?.title ?? 'Focus'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Focus mode</div>
        <div className="flex items-center gap-2">
          {(phase === 'running' || phase === 'paused') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={switchToTimerBar}
              disabled={startBackendTimer.isPending}
              title="Exit focus mode but keep timer running in the top bar"
            >
              <Timer className="h-4 w-4 mr-1" />
              Switch to timer bar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={close} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-8">
        {phase === 'completed' ? (
          <div className="max-w-xl w-full space-y-6">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Task complete</div>
              <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">Nicely done. One last thought.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What's the smallest next step?</label>
              <input
                autoFocus
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !savingNextStep) {
                    e.preventDefault()
                    saveNextStep()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    close()
                  }
                }}
                placeholder="e.g. Send the draft to Ana for review"
                className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="text-xs text-muted-foreground">
                Added to backlog. Leave empty to skip.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={close} disabled={savingNextStep}>Skip</Button>
              <Button onClick={saveNextStep} disabled={savingNextStep}>
                {savingNextStep ? 'Saving…' : nextStep.trim() ? 'Add next step' : 'Done'}
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
              <label className="text-sm font-medium">What does done look like?</label>
              <textarea
                autoFocus
                rows={2}
                value={acceptance}
                onChange={(e) => setAcceptance(e.target.value)}
                placeholder="e.g. First draft written, skeleton PR opened, etc."
                className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">How long do you actually need?</label>
              <div className="flex items-center gap-2 text-sm">
                {[15, 25, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDurationMinutes(m)}
                    className={`rounded-md border px-3 py-1.5 transition-colors ${
                      durationMinutes === m
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent/40'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={480}
                  placeholder="custom"
                  value={durationMinutes && ![15, 25, 45, 60, 90].includes(durationMinutes) ? durationMinutes : ''}
                  onChange={(e) => setDurationMinutes(e.target.value ? Math.min(480, Math.max(1, Number(e.target.value))) : null)}
                  className="w-20 rounded-md border border-border bg-background px-2 py-1.5"
                />
                <span className="text-muted-foreground">min</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {task?.plannedTimeMinutes || task?.estimatedDurationMinutes
                  ? `Planned: ${task.plannedTimeMinutes ?? task.estimatedDurationMinutes}m`
                  : 'No planned time on task.'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={start}>Start focus</Button>
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
                <Button variant="outline" onClick={pause}>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </Button>
              ) : (
                <Button variant="outline" onClick={resume}>
                  <Play className="h-4 w-4 mr-1" /> Resume
                </Button>
              )}
              <Button onClick={complete}>
                <Check className="h-4 w-4 mr-1" /> Complete
              </Button>
              <Button variant="ghost" onClick={cutShort}>
                <LogOut className="h-4 w-4 mr-1" /> Cut short
              </Button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
