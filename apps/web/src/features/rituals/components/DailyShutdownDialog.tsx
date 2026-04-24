import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { tasksApi } from '@/features/tasks/api'
import { tasksQueries } from '@/features/tasks/queries'
import { PromptRitualDialog } from './PromptRitualDialog'
import { AiRitualSummary } from './AiRitualSummary'
import { FatigueSignal } from '@/features/fatigue/components/FatigueSignal'
import type { RitualInstance } from '../api'
import type { Task } from '@repo/shared/types'

interface Props {
  instance: RitualInstance
  open: boolean
  onClose: () => void
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DailyShutdownDialog({ instance, open, onClose }: Props) {
  const today = toYMD(new Date())
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = toYMD(tomorrowDate)

  const tasksQuery = useQuery(tasksQueries.today(today))
  const openTasks = useMemo(
    () => ((tasksQuery.data?.data ?? []) as Task[]).filter((t) => t.status === 'open'),
    [tasksQuery.data],
  )

  const qc = useQueryClient()
  const [rolling, setRolling] = useState(false)
  const [rolledIds, setRolledIds] = useState<Set<string>>(new Set())

  async function rolloverAll(taskList: Task[], complete: (snapshot?: unknown) => Promise<void>) {
    setRolling(true)
    let moved = 0
    let failed = 0
    for (const t of taskList) {
      try {
        await tasksApi.update(t.id, { scheduledDate: tomorrow, scheduledStart: null, scheduledEnd: null } as any)
        moved++
        setRolledIds((s) => new Set(s).add(t.id))
      } catch {
        failed++
      }
    }
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['working-sessions'] })
    setRolling(false)
    if (moved > 0) toast.success(`Rolled ${moved} task${moved === 1 ? '' : 's'} to tomorrow`)
    if (failed > 0) toast.warning(`${failed} failed to roll over`)
    await complete({ rolledOver: moved, skippedRollover: failed })
  }

  return (
    <PromptRitualDialog
      instance={instance}
      open={open}
      onClose={onClose}
      title="Daily Shutdown"
      hint={
        <div className="space-y-2">
          <p>Close the day cleanly. Reflect, then roll over what's left.</p>
          <FatigueSignal variant="inline" />
          <AiRitualSummary
            instanceId={instance.id}
            label="Summarize my day"
            cached={(instance.snapshot as any)?.aiSummary ?? null}
            cachedAt={(instance.snapshot as any)?.aiSummaryAt ?? null}
          />
        </div>
      }
      finalStep={({ complete, back }) => {
        const remaining = openTasks.filter((t) => !rolledIds.has(t.id))
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {remaining.length === 0
                ? 'No open tasks left for today. Clean shutdown.'
                : `${remaining.length} open task${remaining.length === 1 ? '' : 's'} still on today. Roll them to tomorrow?`}
            </p>
            {remaining.length > 0 && (
              <ul className="max-h-48 overflow-y-auto space-y-1 pr-1 rounded-md border border-border/40 bg-muted/10 p-2">
                {remaining.map((t) => (
                  <li key={t.id} className="truncate text-sm px-2 py-1">
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={back} disabled={rolling}>Back</Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => complete({ rolledOver: 0 })} disabled={rolling}>
                  Skip rollover
                </Button>
                {remaining.length > 0 && (
                  <Button onClick={() => rolloverAll(remaining, complete)} disabled={rolling}>
                    {rolling ? 'Rolling…' : `Roll over ${remaining.length} & finish`}
                  </Button>
                )}
                {remaining.length === 0 && (
                  <Button onClick={() => complete({ rolledOver: 0 })} disabled={rolling}>Finish</Button>
                )}
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}
