import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import {
  useRecurringList,
  useCreateRecurring,
  useDeleteRecurring,
  useMaterializeRecurring,
} from '../queries'
import type { RecurrencePattern, RecurringSeries } from '../api'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function todayYMD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function RecurringManager() {
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

  return (
    <div>
      <SectionHeader
        sectionId="recurring"
        title="Recurring"
        description="Tasks that re-materialize automatically. Ideal for habits, weekly reviews, daily check-ins."
        actions={
          <Button variant="outline" size="sm" onClick={handleMaterialize} disabled={materialize.isPending}>
            {materialize.isPending ? 'Running…' : 'Materialize due'}
          </Button>
        }
      />

      <div className="mx-auto max-w-4xl px-6 pb-6 space-y-4">
        {list.isLoading && <SkeletonList lines={4} />}

        {!list.isLoading && (list.data ?? []).length === 0 && (
          <EmptyState title="No recurring series yet" description="Create one below — it'll spawn a Task every time its pattern matches." />
        )}

        {!list.isLoading && (list.data ?? []).length > 0 && (
          <div className="rounded-lg border border-border/60 bg-card/30 divide-y divide-border/40">
            {(list.data ?? []).map((s) => (
              <RecurringRow key={s.id} series={s} onDelete={handleDelete} />
            ))}
          </div>
        )}

        <CreateForm />
      </div>
    </div>
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

function CreateForm() {
  const [title, setTitle] = useState('')
  const [pattern, setPattern] = useState<RecurrencePattern>('DAILY')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [atTime, setAtTime] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [asHabit, setAsHabit] = useState(false)
  const create = useCreateRecurring()

  function toggleDay(d: number) {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  async function submit() {
    if (!title.trim()) return
    try {
      await create.mutateAsync({
        pattern,
        daysOfWeek: pattern === 'WEEKLY' ? daysOfWeek : [],
        atRoughlyTime: atTime || undefined,
        startDate: todayYMD(),
        templateTaskJson: {
          title: title.trim(),
          kind: asHabit ? 'HABIT' : 'TASK',
          ...(durationMin ? { plannedTimeMinutes: Number(durationMin) } : {}),
        },
      })
      toast.success('Recurring series created')
      setTitle('')
      setAtTime('')
      setDurationMin('')
      setDaysOfWeek([])
      setPattern('DAILY')
      setAsHabit(false)
    } catch (err) {
      toast.error((err as Error).message || 'Create failed')
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-4 space-y-3">
      <h3 className="text-sm font-medium">New recurring series</h3>

      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title (e.g. Morning review, Workout)"
          className="h-9"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={pattern} onValueChange={(v) => setPattern(v as RecurrencePattern)}>
            <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKDAYS">Weekdays</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="time"
            value={atTime}
            onChange={(e) => setAtTime(e.target.value)}
            placeholder="time"
            className="h-9 w-28"
          />
          <Input
            type="number"
            min={1}
            max={480}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder="mins"
            className="h-9 w-24"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <input type="checkbox" checked={asHabit} onChange={(e) => setAsHabit(e.target.checked)} />
            as Habit
          </label>
        </div>

        {pattern === 'WEEKLY' && (
          <div className="flex items-center gap-1">
            {DOW_LABELS.map((lbl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`h-8 w-10 rounded-md border text-xs transition-colors ${
                  daysOfWeek.includes(i)
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={!title.trim() || create.isPending}>
          {create.isPending ? 'Creating…' : 'Create series'}
        </Button>
      </div>
    </div>
  )
}
