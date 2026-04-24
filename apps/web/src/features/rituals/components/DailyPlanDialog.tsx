import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { tasksQueries } from '@/features/tasks/queries'
import { schedulingApi } from '@/features/scheduling/api'
import { schedulingKeys } from '@/features/scheduling/queries'
import { useAddReflection, useUpdateRitualInstance } from '../queries'
import type { RitualInstance } from '../api'
import type { Task } from '@repo/shared/types'

interface Props {
  instance: RitualInstance
  open: boolean
  onClose: () => void
}

type Step = 'highlight' | 'confirm' | 'plan' | 'done'

export function DailyPlanDialog({ instance, open, onClose }: Props) {
  const [step, setStep] = useState<Step>('highlight')
  const [highlight, setHighlight] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [planning, setPlanning] = useState(false)

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const tasksQuery = useQuery(tasksQueries.today(today))
  const openTasks = useMemo(
    () => ((tasksQuery.data?.data ?? []) as Task[]).filter((t) => t.status === 'open'),
    [tasksQuery.data],
  )

  const qc = useQueryClient()
  const updateInstance = useUpdateRitualInstance()
  const addReflection = useAddReflection()

  useEffect(() => {
    // Default: all open tasks selected
    setSelectedTaskIds(new Set(openTasks.map((t) => t.id)))
  }, [openTasks])

  useEffect(() => {
    if (open && instance.status === 'PENDING') {
      updateInstance.mutateAsync({ id: instance.id, body: { status: 'IN_PROGRESS', startedAt: new Date().toISOString() } }).catch(() => undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function saveHighlightAndAdvance() {
    if (highlight.trim()) {
      try {
        await addReflection.mutateAsync({ ritualInstanceId: instance.id, promptKey: 'highlight', body: highlight.trim() })
      } catch (err) {
        toast.error((err as Error).message || 'Failed to save highlight')
        return
      }
    }
    setStep('confirm')
  }

  function toggleTask(id: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function planAndComplete() {
    setPlanning(true)
    const toSchedule = openTasks.filter((t) => selectedTaskIds.has(t.id) && !t.scheduledStart)
    let scheduled = 0
    let failed = 0
    for (const task of toSchedule) {
      try {
        const r = await schedulingApi.autoSchedule({ taskId: task.id, day: today })
        if (r.type === 'Success') scheduled++
        else failed++
      } catch {
        failed++
      }
    }
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: schedulingKeys.sessions })

    try {
      await updateInstance.mutateAsync({
        id: instance.id,
        body: {
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          snapshot: { highlight: highlight.trim() || null, selectedTaskIds: Array.from(selectedTaskIds), scheduled, failed },
        },
      })
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save ritual')
      setPlanning(false)
      return
    }

    if (scheduled > 0 && failed === 0) toast.success(`Day planned · ${scheduled} task${scheduled === 1 ? '' : 's'} scheduled`)
    else if (scheduled > 0 && failed > 0) toast.success(`Scheduled ${scheduled} · ${failed} couldn't fit`)
    else if (scheduled === 0 && failed === 0) toast.success('Day planned')
    else toast.warning(`Couldn't schedule ${failed} task${failed === 1 ? '' : 's'}`)

    setPlanning(false)
    setStep('done')
    onClose()
  }

  async function skip() {
    try {
      await updateInstance.mutateAsync({ id: instance.id, body: { status: 'SKIPPED' } })
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to skip')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Daily Plan</DialogTitle>
          <DialogDescription>
            {step === 'highlight' && 'Step 1 of 3 — Set your highlight'}
            {step === 'confirm' && `Step 2 of 3 — Confirm today's tasks (${selectedTaskIds.size}/${openTasks.length})`}
            {step === 'plan' && 'Step 3 of 3 — Plan the day'}
          </DialogDescription>
        </DialogHeader>

        {step === 'highlight' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The one thing that, if done, makes today a win.
            </p>
            <textarea
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Today I want to…"
              className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={skip}>Skip ritual</Button>
              <Button onClick={saveHighlightAndAdvance}>Next</Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks for today. Capture something with Cmd+K first.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto space-y-1 pr-1">
                {openTasks.map((t) => (
                  <li key={t.id}>
                    <label className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(t.id)}
                        onChange={() => toggleTask(t.id)}
                      />
                      <span className="text-sm truncate flex-1">{t.title}</span>
                      {t.scheduledStart ? (
                        <span className="text-[10px] uppercase text-muted-foreground">scheduled</span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('highlight')}>Back</Button>
              <Button onClick={() => setStep('plan')} disabled={openTasks.length === 0}>Next</Button>
            </div>
          </div>
        )}

        {step === 'plan' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The engine will auto-schedule selected tasks into your working hours, respecting existing calendar events.
            </p>
            <div className="rounded-md bg-muted/30 p-3 text-xs">
              <div>Highlight: <span className="font-medium">{highlight.trim() || '(none)'}</span></div>
              <div>
                Tasks to schedule:{' '}
                <span className="font-medium">
                  {openTasks.filter((t) => selectedTaskIds.has(t.id) && !t.scheduledStart).length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('confirm')} disabled={planning}>Back</Button>
              <Button onClick={planAndComplete} disabled={planning}>
                {planning ? 'Planning…' : 'Plan the day'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
