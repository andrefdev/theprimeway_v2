import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { X as XIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useWorkingSessionsRange,
  useCalendarEventsRange,
  useDeleteWorkingSession,
  useDeconflict,
} from '@/features/scheduling/queries'
import { schedulingKeys } from '@/features/scheduling/queries'
import { workingSessionsApi } from '@/features/scheduling/working-sessions-api'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { WorkloadCounter } from '@/features/scheduling/components/WorkloadCounter'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksQueries } from '@/features/tasks/queries'
import type { Task } from '@repo/shared/types'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useRitualsWeek } from '@/features/rituals/queries'
import { WeeklyPlanDialog, WeeklyReviewDialog } from '@/features/rituals/components/WeeklyRitualDialog'

const START_HOUR = 6
const END_HOUR = 22
const SLOT_PX = 48 // px per hour
const SNAP_MINUTES = 15

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  const delta = (day + 6) % 7 // Monday start
  x.setDate(x.getDate() - delta)
  return x
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatRange(from: Date, to: Date): string {
  const sameMonth = from.getMonth() === to.getMonth()
  const f = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  return sameMonth
    ? `${f.format(from)} – ${new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(to)}`
    : `${f.format(from)} – ${f.format(to)}`
}
function minutesSinceDayStart(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() - START_HOUR * 60
}
function toPx(minutes: number): number {
  return (minutes / 60) * SLOT_PX
}
function sameDayLocal(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function snap(minutes: number, step: number = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step
}
function formatHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface SessionLite {
  id: string
  start: string
  end: string
  task: { title: string } | null
  createdBy: string
}

interface EventLite {
  id: string
  title: string
  start: string
  end: string
}

export function CompassView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])
  const fromIso = useMemo(() => weekStart.toISOString(), [weekStart])
  const toIso = useMemo(() => weekEnd.toISOString(), [weekEnd])

  const sessions = useWorkingSessionsRange(fromIso, toIso)
  const events = useCalendarEventsRange(fromIso, toIso)
  const today = toYMD(new Date())
  const todayTasks = useQuery(tasksQueries.today(today))
  const del = useDeleteWorkingSession()
  const deconflict = useDeconflict()
  const qc = useQueryClient()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  // Weekly rituals — auto-surface when their scheduled moment has arrived.
  const ritualsWeek = useRitualsWeek()
  const pendingWeeklyPlan = ritualsWeek.data?.pending.find((p) => p.ritual.kind === 'WEEKLY_PLAN') ?? null
  const pendingWeeklyReview = ritualsWeek.data?.pending.find((p) => p.ritual.kind === 'WEEKLY_REVIEW') ?? null
  const [weeklyPlanOpen, setWeeklyPlanOpen] = useState(false)
  const [weeklyPlanDismissed, setWeeklyPlanDismissed] = useState(false)
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false)
  const [weeklyReviewDismissed, setWeeklyReviewDismissed] = useState(false)

  useEffect(() => {
    if (!pendingWeeklyPlan || weeklyPlanDismissed) return
    if (new Date() >= new Date(pendingWeeklyPlan.scheduledFor)) setWeeklyPlanOpen(true)
  }, [pendingWeeklyPlan, weeklyPlanDismissed])

  useEffect(() => {
    if (!pendingWeeklyReview || weeklyReviewDismissed) return
    if (new Date() >= new Date(pendingWeeklyReview.scheduledFor)) setWeeklyReviewOpen(true)
  }, [pendingWeeklyReview, weeklyReviewDismissed])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart],
  )
  const hours = useMemo(() => {
    const hs: number[] = []
    for (let h = START_HOUR; h <= END_HOUR; h++) hs.push(h)
    return hs
  }, [])

  const sessionsById = useMemo(() => {
    const map = new Map<string, SessionLite>()
    for (const s of sessions.data ?? []) {
      if (s.kind === 'WORK') map.set(s.id, s as any)
    }
    return map
  }, [sessions.data])

  async function removeSession(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success('Removed')
    } catch (err) {
      toast.error((err as Error).message || 'Failed')
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const session = sessionsById.get(String(e.active.id))
    if (!session) return
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return

    const targetDay = new Date(`${overId}T00:00:00`)
    const sourceStart = new Date(session.start)
    const duration = new Date(session.end).getTime() - sourceStart.getTime()

    // Minute delta from vertical drag, snapped to 15 min
    const minuteDelta = snap((e.delta.y * 60) / SLOT_PX)

    // New start: target day with original time-of-day + delta
    const newStart = new Date(targetDay)
    newStart.setHours(sourceStart.getHours(), sourceStart.getMinutes(), 0, 0)
    newStart.setMinutes(newStart.getMinutes() + minuteDelta)
    const newEnd = new Date(newStart.getTime() + duration)

    // No-op guard
    if (newStart.getTime() === sourceStart.getTime()) return

    // Validate: within working window
    const minMs = new Date(targetDay)
    minMs.setHours(START_HOUR, 0, 0, 0)
    const maxMs = new Date(targetDay)
    maxMs.setHours(END_HOUR, 0, 0, 0)
    if (newStart < minMs || newEnd > maxMs) {
      toast.warning(`Outside working window (${START_HOUR}:00–${END_HOUR}:00)`)
      return
    }

    // Validate: doesn't overlap a busy, non-declined calendar event on that day
    const dayEvents = (events.data ?? []).filter((ev) =>
      sameDayLocal(new Date(ev.start), targetDay) && !ev.isAllDay,
    )
    const hardConflict = dayEvents.find(
      (ev) => new Date(ev.start) < newEnd && new Date(ev.end) > newStart,
    )
    if (hardConflict) {
      toast.warning(`Blocked by calendar event: ${hardConflict.title}`)
      return
    }

    setMutatingId(session.id)
    try {
      await workingSessionsApi.update(session.id, {
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      })
      // Push/replace on Google Calendar happens server-side on PATCH.
      // Reflow sessions the move now overlaps.
      await deconflict.mutateAsync({ sessionId: session.id })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      toast.success(`Moved to ${formatHm(newStart)}`)
    } catch (err) {
      toast.error((err as Error).message || 'Move failed')
    } finally {
      setMutatingId(null)
    }
  }

  return (
    <div>
      <SectionHeader
        sectionId="compass"
        title="Compass"
        description={formatRange(weekStart, addDays(weekEnd, -1))}
        actions={
          <div className="flex items-center gap-2">
            <WorkloadCounter day={today} tasks={(todayTasks.data?.data ?? []) as Task[]} />
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="mx-auto max-w-7xl px-6 pb-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden select-none">
            {/* Day headers */}
            <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border/60 bg-muted/20">
              <div />
              {days.map((d) => {
                const isToday = toYMD(d) === today
                return (
                  <div
                    key={d.toISOString()}
                    className={`px-2 py-2 text-xs font-medium text-center border-l border-border/40 ${
                      isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="uppercase tracking-wide">
                      {new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d)}
                    </div>
                    <div className={`text-base font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {d.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grid body */}
            <div className="grid grid-cols-[4rem_repeat(7,1fr)] relative">
              {/* Hour labels */}
              <div className="flex flex-col">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-t border-border/30 text-[10px] text-muted-foreground pr-2 text-right pt-0.5"
                    style={{ height: SLOT_PX }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {days.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  sessions={(sessions.data ?? []).filter(
                    (s) => sameDayLocal(new Date(s.start), day) && s.kind === 'WORK',
                  ) as unknown as SessionLite[]}
                  events={(events.data ?? []).filter(
                    (ev) => sameDayLocal(new Date(ev.start), day) && ev.isBusy && !ev.isAllDay,
                  ) as unknown as EventLite[]}
                  hoursCount={hours.length}
                  activeId={activeId}
                  mutatingId={mutatingId}
                  onRemoveSession={removeSession}
                />
              ))}
            </div>
          </div>
        </DndContext>

        <p className="mt-3 text-xs text-muted-foreground">
          Drag blocks to reschedule · Snaps to 15 min · Calendar events block drops · Hover a block for [×]
        </p>

        {/* Manual ritual triggers */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {pendingWeeklyPlan && !weeklyPlanOpen && (
            <button
              className="rounded-md border border-border/60 bg-card px-3 py-1.5 hover:bg-accent/40"
              onClick={() => setWeeklyPlanOpen(true)}
            >
              Open Weekly Plan
            </button>
          )}
          {pendingWeeklyReview && !weeklyReviewOpen && (
            <button
              className="rounded-md border border-border/60 bg-card px-3 py-1.5 hover:bg-accent/40"
              onClick={() => setWeeklyReviewOpen(true)}
            >
              Open Weekly Review
            </button>
          )}
        </div>
      </div>

      {pendingWeeklyPlan && (
        <WeeklyPlanDialog
          instance={pendingWeeklyPlan}
          open={weeklyPlanOpen}
          onClose={() => { setWeeklyPlanOpen(false); setWeeklyPlanDismissed(true) }}
        />
      )}
      {pendingWeeklyReview && (
        <WeeklyReviewDialog
          instance={pendingWeeklyReview}
          open={weeklyReviewOpen}
          onClose={() => { setWeeklyReviewOpen(false); setWeeklyReviewDismissed(true) }}
        />
      )}
    </div>
  )
}

function DayColumn({
  day,
  sessions,
  events,
  hoursCount,
  activeId,
  mutatingId,
  onRemoveSession,
}: {
  day: Date
  sessions: SessionLite[]
  events: EventLite[]
  hoursCount: number
  activeId: string | null
  mutatingId: string | null
  onRemoveSession: (id: string) => void
}) {
  const ymd = toYMD(day)
  const { setNodeRef, isOver } = useDroppable({ id: ymd })

  return (
    <div
      ref={setNodeRef}
      className={`relative border-l border-border/40 transition-colors ${isOver ? 'bg-primary/5' : ''}`}
      style={{ height: hoursCount * SLOT_PX }}
    >
      {Array.from({ length: hoursCount }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-border/20"
          style={{ top: i * SLOT_PX }}
        />
      ))}

      {/* Calendar events — read-only, muted */}
      {events.map((e) => {
        const top = toPx(Math.max(0, minutesSinceDayStart(new Date(e.start))))
        const height = toPx(
          Math.max(15, (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000),
        )
        return (
          <div
            key={e.id}
            className="absolute left-1 right-1 rounded-sm border border-muted-foreground/30 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground overflow-hidden pointer-events-none"
            style={{ top, height, zIndex: 1 }}
          >
            <div className="truncate font-medium">{e.title}</div>
          </div>
        )
      })}

      {/* Working sessions — draggable */}
      {sessions.map((s) => (
        <SessionBlock
          key={s.id}
          session={s}
          isActive={activeId === s.id}
          isMuted={activeId !== null && activeId !== s.id}
          isMutating={mutatingId === s.id}
          onRemove={onRemoveSession}
        />
      ))}
    </div>
  )
}

function SessionBlock({
  session,
  isActive,
  isMuted,
  isMutating,
  onRemove,
}: {
  session: SessionLite
  isActive: boolean
  isMuted: boolean
  isMutating: boolean
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: session.id,
    disabled: isMutating,
  })

  const start = new Date(session.start)
  const end = new Date(session.end)
  const top = toPx(Math.max(0, minutesSinceDayStart(start)))
  const height = toPx(Math.max(15, (end.getTime() - start.getTime()) / 60000))

  const style: React.CSSProperties = {
    top,
    height,
    zIndex: isActive ? 30 : 2,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    cursor: isMutating ? 'wait' : 'grab',
    opacity: isMuted ? 0.45 : isMutating ? 0.6 : 1,
    transition: transform ? 'none' : 'opacity 120ms ease',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group absolute left-1 right-1 rounded-sm border px-2 py-1 text-[11px] text-left overflow-hidden ${
        isActive
          ? 'border-primary bg-primary/30 shadow-lg ring-2 ring-primary/40'
          : 'border-primary/40 bg-primary/15 hover:bg-primary/25'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{session.task?.title ?? 'Untitled'}</div>
          {height >= 36 && (
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {formatHm(start)}–{formatHm(end)}
            </div>
          )}
        </div>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => {
            ev.stopPropagation()
            if (confirm(`Remove "${session.task?.title ?? 'Untitled'}"?`)) onRemove(session.id)
          }}
          aria-label="Remove session"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
