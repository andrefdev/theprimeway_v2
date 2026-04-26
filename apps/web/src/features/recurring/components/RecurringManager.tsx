import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/shared/components/ui/card'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { useRecurringList, useDeleteRecurring, useMaterializeRecurring } from '../queries'
import type { RecurringSeries } from '../api'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  /** Render without the outer Card shell (when embedded inside another section). */
  bare?: boolean
}

export function RecurringManager({ bare = false }: Props = {}) {
  const list = useRecurringList()
  const del = useDeleteRecurring()
  const materialize = useMaterializeRecurring()

  async function handleMaterialize() {
    try {
      const r = await materialize.mutateAsync()
      toast.success(`Materialized: ${r.created} new, ${r.skipped} already current (of ${r.seriesChecked} series)`)
    } catch (err) {
      toast.error((err as Error).message || 'Materialize failed')
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete recurring series "${title}"? Existing instances remain but no new ones generate.`)) return
    try {
      await del.mutateAsync(id)
      toast.success('Series deleted')
    } catch (err) {
      toast.error((err as Error).message || 'Delete failed')
    }
  }

  const body = (
    <div className="space-y-4">
      {list.isLoading && <SkeletonList lines={4} />}

      {!list.isLoading && (list.data ?? []).length === 0 && (
        <EmptyState
          title="No recurring series"
          description="Create one from the task dialog: tick “Repeat” when adding a task."
        />
      )}

      {!list.isLoading && (list.data ?? []).length > 0 && (
        <Card className="bg-card/30 py-0 gap-0 divide-y divide-border/40">
          {(list.data ?? []).map((s) => (
            <RecurringRow key={s.id} series={s} onDelete={handleDelete} />
          ))}
        </Card>
      )}
    </div>
  )

  if (bare) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={handleMaterialize} disabled={materialize.isPending}>
            {materialize.isPending ? 'Running…' : 'Materialize due'}
          </Button>
        </div>
        {body}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring series</CardTitle>
        <CardDescription>Tasks that re-materialize automatically. Create new series from the task dialog.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={handleMaterialize} disabled={materialize.isPending}>
            {materialize.isPending ? 'Running…' : 'Materialize due'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

function RecurringRow({
  series,
  onDelete,
}: {
  series: RecurringSeries
  onDelete: (id: string, title: string) => void
}) {
  const template = series.templateTaskJson as Record<string, unknown>
  const title = String(template.title ?? 'Untitled')
  const kind = String(template.kind ?? 'TASK')

  const patternLabel = (() => {
    switch (series.pattern) {
      case 'DAILY':
        return 'Daily'
      case 'WEEKDAYS':
        return 'Weekdays (Mon–Fri)'
      case 'WEEKLY':
        return `Weekly: ${series.daysOfWeek.map((d) => DOW_LABELS[d]).filter(Boolean).join(', ') || '—'}`
      case 'MONTHLY':
        return 'Monthly'
    }
  })()

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {kind === 'HABIT' && <Badge variant="outline" className="text-[10px]">habit</Badge>}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {patternLabel}
          {series.atRoughlyTime && ` · ~${series.atRoughlyTime}`}
          {series.endDate && ` · ends ${series.endDate.slice(0, 10)}`}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(series.id, title)}
      >
        Delete
      </Button>
    </div>
  )
}
