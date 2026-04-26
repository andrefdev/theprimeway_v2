import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { X, Pause, Play, Check, LogOut } from 'lucide-react'
import { useFocusStore } from '../focus-store'
import { tasksApi } from '@/features/tasks/api'
import { schedulingApi } from '@/features/scheduling/api'
import { schedulingKeys } from '@/features/scheduling/queries'
import { useStartTimer, useStopTimer, useUpdateTask } from '@/features/tasks/queries'
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

function computeElapsedSeconds(task: any | null | undefined): number {
  if (!task) return 0
  const prev = task.actualDurationSeconds ?? 0
  if (!task.actualStart || task.actualEnd) return prev
  const started = new Date(task.actualStart).getTime()
  return prev + Math.floor((Date.now() - started) / 1000)
}

export function FocusMode() {
  const { open, taskId, close } = useFocusStore()

  const taskQuery = useQuery({
    queryKey: ['tasks', 'focus', taskId],
    queryFn: () => tasksApi.get(taskId!).then((r) => r.data),
    enabled: !!taskId && open,
    staleTime: 5_000,
    refetchInterval: 30_000,
  })
  const task = taskQuery.data as any

  const qc = useQueryClient()
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const updateTask = useUpdateTask()

  const [phase, setPhase] = useState<Phase>('preflight')
  const [acceptance, setAcceptance] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [nextStep, setNextStep] = useState('')
  const [savingNextStep, setSavingNextStep] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Init/sync from task: preload acceptance + duration; jump to running if backend timer active
  useEffect(() => {
    if (!open || !task) return
    setAcceptance(task.acceptanceCriteria ?? '')
    setDurationMinutes(task.plannedTimeMinutes ?? task.estimatedDurationMinutes ?? task.estimatedDuration ?? null)
    if (task.actualStart && !task.actualEnd) {
      setPhase('running')
    } else if (phase !== 'completed') {
      setPhase('preflight')
    }
    setNextStep('')
    setSavingNextStep(false)
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

  // Tick for live elapsed display while running
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])

  const elapsedMs = useMemo(() => {
    void now
    return computeElapsedSeconds(task) * 1000
  }, [task, now])

  const targetMs = durationMinutes ? durationMinutes * 60_000 : null
  const over = targetMs != null && elapsedMs > targetMs

  async function start() {
    if (!taskId) return
    try {
      const patch: Record<string, unknown> = {}
      if ((task?.acceptanceCriteria ?? '') !== acceptance) {
        patch.acceptanceCriteria = acceptance || null
      }
      const taskDur = task?.estimatedDuration ?? task?.estimatedDurationMinutes ?? null
      if (durationMinutes && durationMinutes !== taskDur) {
        patch.estimatedDuration = durationMinutes
      }
      if (Object.keys(patch).length > 0) {
        await updateTask.mutateAsync({ id: taskId, data: patch as any })
      }
      await startTimer.mutateAsync(taskId)
      schedulingApi.timerStart({ taskId }).catch(() => undefined)
      setPhase('running')
    } catch (err) {
      toast.error((err as Error).message || 'Could not start')
    }
  }

  async function pause() {
    if (phase !== 'running' || !taskId) return
    try {
      await stopTimer.mutateAsync(taskId)
      setPhase('paused')
    } catch (err) {
      toast.error((err as Error).message || 'Pause failed')
    }
  }

  async function resume() {
    if (phase !== 'paused' || !taskId) return
    try {
      await startTimer.mutateAsync(taskId)
      setPhase('running')
    } catch (err) {
      toast.error((err as Error).message || 'Resume failed')
    }
  }

  async function complete() {
    if (!taskId) return
    try {
      if (task?.actualStart && !task?.actualEnd) {
        await stopTimer.mutateAsync(taskId)
      }
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

  function closeKeepingTimer() {
    close()
  }

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
        closeKeepingTimer()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase])

  if (!open || !taskId) return null

  const title = task?.title ?? 'Focus'
  const isStarting = startTimer.isPending || updateTask.isPending
  const isPausing = stopTimer.isPending

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Focus mode</div>
        <Button variant="ghost" size="sm" onClick={closeKeepingTimer} aria-label="Close">
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
                  if (e.key === 'Enter' && !savingNextStep) {
                    e.preventDefault()
                    saveNextStep()
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
                {[15, 25, 45, 60, 90].map((m) => (
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
                  value={durationMinutes && ![15, 25, 45, 60, 90].includes(durationMinutes) ? durationMinutes : ''}
                  onChange={(e) => setDurationMinutes(e.target.value ? Math.min(480, Math.max(1, Number(e.target.value))) : null)}
                  className="w-20"
                />
                <span className="text-muted-foreground">min</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={start} disabled={isStarting}>
                {isStarting ? 'Starting…' : 'Start focus'}
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
                  <Button variant="outline" onClick={pause} disabled={isPausing}>
                    <Pause className="h-4 w-4 mr-1" /> Pause
                  </Button>
                ) : (
                  <Button variant="outline" onClick={resume} disabled={isStarting}>
                    <Play className="h-4 w-4 mr-1" /> Resume
                  </Button>
                )}
                <Button onClick={complete}>
                  <Check className="h-4 w-4 mr-1" /> Complete
                </Button>
                <Button variant="ghost" onClick={closeKeepingTimer}>
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
