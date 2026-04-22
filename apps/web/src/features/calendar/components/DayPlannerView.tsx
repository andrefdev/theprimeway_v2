import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format, isSameDay, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Clock, GripVertical, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { CompletionToggle } from '@/shared/components/CompletionToggle'
import { tasksQueries, useUpdateTask } from '@/features/tasks/queries'
import { calendarQueries } from '../queries'
import { cn } from '@/shared/lib/utils'
import type { Task, CalendarEvent } from '@repo/shared/types'

// Timeline config
const DAY_START_HOUR = 6 // 6am
const DAY_END_HOUR = 23 // 11pm
const HOUR_HEIGHT = 60 // px per hour
const SLOT_MINUTES = 30 // drop granularity
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR

interface Block {
  id: string
  title: string
  start: Date
  end: Date
  type: 'task' | 'event'
  color?: string
  task?: Task
  status?: string
}

export function DayPlannerView({ day }: { day: Date }) {
  const { t } = useTranslation('calendar')
  const updateTask = useUpdateTask()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(i)
  }, [])

  const dayStr = format(day, 'yyyy-MM-dd')
  const tasksQuery = useQuery(tasksQueries.list({ from: dayStr, to: dayStr, limit: '200' }))
  const eventsQuery = useQuery(
    calendarQueries.googleEvents({
      timeMin: `${dayStr}T00:00:00.000Z`,
      timeMax: `${dayStr}T23:59:59.999Z`,
    }),
  )

  const tasks = (tasksQuery.data?.data ?? []) as Task[]
  const events = (eventsQuery.data?.data ?? []) as CalendarEvent[]

  const unscheduled = useMemo(
    () => tasks.filter((x) => !x.scheduledStart && x.status !== 'completed'),
    [tasks],
  )

  const blocks = useMemo<Block[]>(() => {
    const out: Block[] = []
    for (const task of tasks) {
      if (!task.scheduledStart) continue
      const start = new Date(task.scheduledStart)
      if (isNaN(start.getTime()) || !isSameDay(start, day)) continue
      const end = task.scheduledEnd
        ? new Date(task.scheduledEnd)
        : new Date(start.getTime() + (task.estimatedDuration ?? 30) * 60_000)
      out.push({
        id: `task-${task.id}`,
        title: task.title,
        start,
        end,
        type: 'task',
        task,
        status: task.status,
      })
    }
    for (const ev of events) {
      const start = new Date(ev.startTime)
      const end = new Date(ev.endTime)
      if (isNaN(start.getTime()) || ev.isAllDay) continue
      if (!isSameDay(start, day)) continue
      out.push({
        id: `event-${ev.id}`,
        title: ev.title,
        start,
        end,
        type: 'event',
        color: ev.color ?? undefined,
      })
    }
    return out
  }, [tasks, events, day])

  // Auto-scroll to current hour on mount (today only)
  useEffect(() => {
    if (!scrollRef.current || !isSameDay(day, new Date())) return
    const nowH = now.getHours() + now.getMinutes() / 60
    const top = Math.max(0, (nowH - DAY_START_HOUR - 1) * HOUR_HEIGHT)
    scrollRef.current.scrollTop = top
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const taskId = String(active.id).replace(/^inbox-/, '').replace(/^block-/, '')
    const overId = String(over.id)
    const match = overId.match(/^slot-(\d+)-(\d+)$/)
    if (!match) return
    const hour = Number(match[1])
    const minute = Number(match[2])
    const task = tasks.find((x) => x.id === taskId)
    if (!task) return

    const start = new Date(day)
    start.setHours(hour, minute, 0, 0)
    const duration = task.estimatedDuration ?? 30
    const end = new Date(start.getTime() + duration * 60_000)

    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: {
          scheduledDate: format(start, 'yyyy-MM-dd'),
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
        },
      })
    } catch {
      toast.error(t('failedToSchedule', { defaultValue: 'Failed to schedule' }))
    }
  }

  async function autoSchedule() {
    const occupied: Array<[number, number]> = blocks.map((b) => [
      b.start.getTime(),
      b.end.getTime(),
    ])
    const dayAnchor = startOfDay(day).getTime()
    const workStart = dayAnchor + DAY_START_HOUR * 3_600_000
    const workEnd = dayAnchor + DAY_END_HOUR * 3_600_000
    // Start from now if today
    let cursor = isSameDay(day, new Date()) ? Math.max(workStart, Date.now()) : workStart
    // Snap to next slot
    cursor = Math.ceil(cursor / (SLOT_MINUTES * 60_000)) * (SLOT_MINUTES * 60_000)

    const updates: Array<Promise<unknown>> = []
    for (const task of unscheduled) {
      const dur = (task.estimatedDuration ?? 30) * 60_000
      // Find next free window
      while (cursor + dur <= workEnd) {
        const conflict = occupied.find(([s, e]) => cursor < e && cursor + dur > s)
        if (!conflict) break
        cursor = Math.ceil(conflict[1] / (SLOT_MINUTES * 60_000)) * (SLOT_MINUTES * 60_000)
      }
      if (cursor + dur > workEnd) break
      const start = new Date(cursor)
      const end = new Date(cursor + dur)
      occupied.push([cursor, cursor + dur])
      updates.push(
        updateTask.mutateAsync({
          id: task.id,
          data: {
            scheduledDate: format(start, 'yyyy-MM-dd'),
            scheduledStart: start.toISOString(),
            scheduledEnd: end.toISOString(),
          },
        }),
      )
      cursor = cursor + dur
    }
    try {
      await Promise.all(updates)
      toast.success(
        t('autoScheduled', { defaultValue: 'Scheduled {{count}} tasks', count: updates.length }),
      )
    } catch {
      toast.error(t('failedToSchedule', { defaultValue: 'Failed to schedule' }))
    }
  }

  const plannedMinutes = blocks.reduce(
    (acc, b) => acc + Math.max(0, (b.end.getTime() - b.start.getTime()) / 60_000),
    0,
  )
  const unscheduledMinutes = unscheduled.reduce(
    (acc, t) => acc + (t.estimatedDuration ?? 30),
    0,
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Left: task inbox */}
        <div className="flex flex-col rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t('todaysTasks', { ns: 'dashboard', defaultValue: "Today's tasks" })}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {unscheduled.length} {t('unscheduled', { defaultValue: 'unscheduled' })} ·{' '}
                {formatMinutes(unscheduledMinutes)}
              </p>
            </div>
            {unscheduled.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={autoSchedule}
                disabled={updateTask.isPending}
                className="gap-1 h-8"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('autoSchedule', { defaultValue: 'Auto' })}
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1 p-3">
            {unscheduled.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                {t('allPlanned', { defaultValue: 'All tasks planned' })}
              </p>
            ) : (
              <div className="space-y-2">
                {unscheduled.map((task) => (
                  <DraggableInboxTask key={task.id} task={task} />
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            {t('planned', { defaultValue: 'Planned' })}: {formatMinutes(plannedMinutes)}
          </div>
        </div>

        {/* Right: timeline */}
        <div className="flex flex-col rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              {format(day, 'EEEE, MMM d')}
            </h3>
            <div className="text-[11px] text-muted-foreground">
              {DAY_START_HOUR}:00 – {DAY_END_HOUR}:00
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <Timeline blocks={blocks} day={day} now={now} />
          </div>
        </div>
      </div>
    </DndContext>
  )
}

function DraggableInboxTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `inbox-${task.id}`,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 hover:border-primary/50 transition-colors"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {task.estimatedDuration ?? 30}m
          </span>
          {task.priority === 'high' && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">
              high
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function Timeline({ blocks, day, now }: { blocks: Block[]; day: Date; now: Date }) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_START_HOUR + i)
  const isToday = isSameDay(day, now)
  const nowTop = isToday
    ? (now.getHours() + now.getMinutes() / 60 - DAY_START_HOUR) * HOUR_HEIGHT
    : null

  return (
    <div className="flex">
      {/* Hour labels */}
      <div className="w-14 flex-shrink-0 border-r border-border">
        {hours.map((h) => (
          <div
            key={h}
            style={{ height: HOUR_HEIGHT }}
            className="text-[10px] text-muted-foreground pr-2 pt-1 text-right"
          >
            {formatHour(h)}
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div className="flex-1 relative">
        {hours.map((h) => (
          <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-border/40">
            <DropSlot hour={h} minute={0} />
            <DropSlot hour={h} minute={SLOT_MINUTES} />
          </div>
        ))}

        {/* Blocks */}
        {blocks.map((b) => (
          <BlockView key={b.id} block={b} />
        ))}

        {/* Now line */}
        {nowTop !== null && nowTop >= 0 && nowTop <= TOTAL_HOURS * HOUR_HEIGHT && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: nowTop }}
          >
            <div className="h-px bg-red-500" />
            <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          </div>
        )}
      </div>
    </div>
  )
}

function DropSlot({ hour, minute }: { hour: number; minute: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}-${minute}` })
  return (
    <div
      ref={setNodeRef}
      style={{ height: HOUR_HEIGHT / 2 }}
      className={cn(
        'transition-colors border-b border-dashed border-transparent',
        isOver && 'bg-primary/20 border-primary/50',
      )}
    />
  )
}

function BlockView({ block }: { block: Block }) {
  const startMin =
    (block.start.getHours() - DAY_START_HOUR) * 60 + block.start.getMinutes()
  const durMin = Math.max(
    15,
    (block.end.getTime() - block.start.getTime()) / 60_000,
  )
  const top = (startMin / 60) * HOUR_HEIGHT
  const height = (durMin / 60) * HOUR_HEIGHT
  if (top < 0 || top > TOTAL_HOURS * HOUR_HEIGHT) return null

  const isTask = block.type === 'task'
  const done = block.status === 'completed'

  return (
    <div
      className={cn(
        'absolute left-1 right-1 rounded-md px-2 py-1 text-xs overflow-hidden z-10 border',
        isTask
          ? done
            ? 'bg-muted/50 border-muted-foreground/30 text-muted-foreground line-through'
            : 'bg-primary/15 border-primary/40 text-foreground'
          : 'bg-violet-500/15 border-violet-500/40 text-foreground',
      )}
      style={{ top, height: height - 2 }}
      title={block.title}
    >
      <div className="flex items-start gap-1.5">
        {isTask && block.task && (
          <BlockTaskToggle task={block.task} done={done} />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate leading-tight">{block.title}</p>
          {height >= 40 && (
            <p className="text-[10px] text-muted-foreground">
              {format(block.start, 'h:mm')} – {format(block.end, 'h:mm a')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function BlockTaskToggle({ task, done }: { task: Task; done: boolean }) {
  const updateTask = useUpdateTask()
  return (
    <div className="pt-0.5">
      <CompletionToggle
        completed={done}
        onClick={() =>
          updateTask.mutate({
            id: task.id,
            data: { status: done ? 'open' : 'completed' },
          })
        }
      />
    </div>
  )
}

function formatHour(h: number) {
  const period = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${period}`
}

function formatMinutes(m: number) {
  const h = Math.floor(m / 60)
  const mm = Math.round(m % 60)
  if (h <= 0) return `${mm}m`
  if (mm === 0) return `${h}h`
  return `${h}h ${mm}m`
}
