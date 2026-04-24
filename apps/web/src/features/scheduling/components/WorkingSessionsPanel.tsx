import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useWorkingSessionsForDay, useDeleteWorkingSession } from '../queries'
import type { WorkingSession } from '../working-sessions-api'

interface Props {
  /** yyyy-mm-dd */
  day: string
}

function formatHm(iso: string): string {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function sourceLabel(s: WorkingSession['createdBy']): string {
  switch (s) {
    case 'AUTO_SCHEDULE':
      return 'auto'
    case 'AUTO_RESCHEDULE':
      return 'rescheduled'
    case 'SPLIT':
      return 'split'
    case 'IMPORT':
      return 'import'
    default:
      return 'user'
  }
}

export function WorkingSessionsPanel({ day }: Props) {
  const query = useWorkingSessionsForDay(day)
  const del = useDeleteWorkingSession()

  if (query.isLoading) return null
  const sessions = (query.data ?? []).filter((s) => s.kind === 'WORK')
  if (sessions.length === 0) return null

  async function remove(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success('Session removed')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to remove')
    }
  }

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 60_000),
    0,
  )
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const totalLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Scheduled blocks</h3>
        <span className="text-xs text-muted-foreground">
          {sessions.length} block{sessions.length === 1 ? '' : 's'} · {totalLabel}
        </span>
      </div>
      <ul className="space-y-1">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/30"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-muted-foreground tabular-nums text-xs w-24 flex-shrink-0">
                {formatHm(s.start)} – {formatHm(s.end)}
              </span>
              <span className="truncate">{s.task?.title ?? '(no task)'}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 flex-shrink-0">
                {sourceLabel(s.createdBy)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => remove(s.id)}
              disabled={del.isPending}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
