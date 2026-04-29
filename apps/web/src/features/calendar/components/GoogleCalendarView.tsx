import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addDays,
  addMonths,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@/shared/components/Icons'
import { Button } from '@/shared/components/ui/button'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { useLocale } from '@/i18n/useLocale'
import { cn } from '@/shared/lib/utils'
import { useCalendarItems, getItemsForDay, type CalendarItem } from '../hooks/use-calendar-items'
import { TaskDialog } from '@/features/tasks/components/TaskDialog'
import { QuickTaskDialog } from '@/features/tasks/components/QuickTaskDialog'
import { EventQuickView } from './EventQuickView'
import { EventEditDialog } from './EventEditDialog'
import type { Task } from '@repo/shared/types'
import { toast } from 'sonner'
import { useDeleteGoogleEvent } from '../queries'

const SLOT_MINUTES = 30

type ViewMode = 'day' | 'week' | 'month'

const HOUR_HEIGHT = 48
const START_HOUR = 0
const END_HOUR = 24
const LABEL_WIDTH = 56 // px
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT

const COLOR_BG: Record<string, string> = {
  red: 'bg-destructive/15 border-l-destructive',
  yellow: 'bg-yellow-500/15 border-l-yellow-500',
  blue: 'bg-blue-500/15 border-l-blue-500',
  green: 'bg-emerald-500/15 border-l-emerald-500',
  purple: 'bg-violet-500/15 border-l-violet-500',
}

const DOT_COLORS: Record<string, string> = {
  red: 'bg-destructive',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
}

export function GoogleCalendarView() {
  const { t } = useTranslation('calendar')
  const { dateFnsLocale } = useLocale()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [mode, setMode] = useState<ViewMode>('week')
  const [slotDialog, setSlotDialog] = useState<{ start: Date; end: Date } | null>(null)
  const [eventCreateSlot, setEventCreateSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [quickView, setQuickView] = useState<{ item: CalendarItem; anchor: HTMLElement } | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null)
  const deleteEvent = useDeleteGoogleEvent()
  const today = new Date()

  const range = useMemo(() => {
    if (mode === 'day') {
      return { start: currentDate, end: currentDate }
    }
    if (mode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 })
      return { start: s, end: addDays(s, 6) }
    }
    const s = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const e = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return { start: s, end: e }
  }, [currentDate, mode])

  const { items, isLoading } = useCalendarItems({
    from: format(range.start, 'yyyy-MM-dd'),
    to: format(range.end, 'yyyy-MM-dd'),
  })

  function prev() {
    if (mode === 'day') setCurrentDate((d) => addDays(d, -1))
    else if (mode === 'week') setCurrentDate((d) => addDays(d, -7))
    else setCurrentDate((d) => subMonths(d, 1))
  }
  function next() {
    if (mode === 'day') setCurrentDate((d) => addDays(d, 1))
    else if (mode === 'week') setCurrentDate((d) => addDays(d, 7))
    else setCurrentDate((d) => addMonths(d, 1))
  }

  const title = useMemo(() => {
    if (mode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale })
    if (mode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 })
      const e = addDays(s, 6)
      if (isSameMonth(s, e)) return format(s, 'MMMM yyyy', { locale: dateFnsLocale })
      return `${format(s, 'MMM', { locale: dateFnsLocale })} – ${format(e, 'MMM yyyy', { locale: dateFnsLocale })}`
    }
    return format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale })
  }, [currentDate, mode, dateFnsLocale])

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="h-8 text-xs"
          >
            {t('today')}
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
              <ChevronRightIcon />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-foreground ml-2">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => {
              const start = new Date()
              start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0)
              const end = new Date(start.getTime() + 30 * 60_000)
              setEventCreateSlot({ start, end })
            }}
          >
            + Event
          </Button>
          <div className="flex rounded-md border border-border overflow-hidden">
          {(['day', 'week', 'month'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                mode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {t(`view${m[0]!.toUpperCase()}${m.slice(1)}` as never, {
                defaultValue: m[0]!.toUpperCase() + m.slice(1),
              })}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonList lines={6} />
          </div>
        ) : mode === 'month' ? (
          <MonthGrid currentDate={currentDate} items={items} today={today} onDayClick={(d) => { setCurrentDate(d); setMode('day') }} />
        ) : (
          <TimeGrid
            days={mode === 'day' ? [currentDate] : weekDays(currentDate)}
            items={items}
            today={today}
            onSlotClick={(start) => {
              const end = new Date(start.getTime() + 30 * 60_000)
              setSlotDialog({ start, end })
            }}
            onItemClick={(item, anchor) => {
              if (item.type === 'task' && item.task) {
                setEditingTask(item.task)
              } else if (item.type === 'event') {
                setQuickView({ item, anchor })
              }
            }}
          />
        )}
      </div>

      {slotDialog && (
        <QuickTaskDialog
          open
          onClose={() => setSlotDialog(null)}
          defaultDate={format(slotDialog.start, 'yyyy-MM-dd')}
          defaultStart={slotDialog.start.toISOString()}
          defaultEnd={slotDialog.end.toISOString()}
        />
      )}

      {editingTask && (
        <TaskDialog
          open
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}

      <EventQuickView
        item={quickView?.item ?? null}
        anchorEl={quickView?.anchor ?? null}
        open={!!quickView}
        onClose={() => setQuickView(null)}
        onEdit={() => {
          if (quickView) {
            setEditingEvent(quickView.item)
            setQuickView(null)
          }
        }}
        onDelete={async () => {
          if (!quickView) return
          const it = quickView.item
          if (!it.googleCalendarId || !it.googleEventId) return
          if (!window.confirm('Delete this event from Google Calendar?')) return
          try {
            await deleteEvent.mutateAsync({
              calendarId: it.googleCalendarId,
              eventId: it.googleEventId,
            })
            toast.success('Event deleted')
            setQuickView(null)
          } catch (e: any) {
            toast.error(e?.message ?? 'Failed to delete')
          }
        }}
      />

      {editingEvent && (
        <EventEditDialog
          open
          onClose={() => setEditingEvent(null)}
          item={editingEvent}
        />
      )}

      {eventCreateSlot && (
        <EventEditDialog
          open
          onClose={() => setEventCreateSlot(null)}
          defaultStart={eventCreateSlot.start}
          defaultEnd={eventCreateSlot.end}
        />
      )}
    </div>
  )
}

function weekDays(d: Date): Date[] {
  const s = startOfWeek(d, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(s, i))
}

// ---------------------------------------------------------------------------
// Week / Day time grid
// ---------------------------------------------------------------------------
function TimeGrid({
  days,
  items,
  today,
  onSlotClick,
  onItemClick,
}: {
  days: Date[]
  items: CalendarItem[]
  today: Date
  onSlotClick: (start: Date) => void
  onItemClick: (item: CalendarItem, anchor: HTMLElement) => void
}) {
  const { dateFnsLocale } = useLocale()
  const { t } = useTranslation('calendar')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (!scrollRef.current) return
    const hasToday = days.some((d) => isSameDay(d, today))
    if (!hasToday) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT
      return
    }
    const nowH = today.getHours() + today.getMinutes() / 60
    scrollRef.current.scrollTop = Math.max(0, (nowH - 1) * HOUR_HEIGHT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0]?.getTime()])

  const gridCols = `${LABEL_WIDTH}px repeat(${days.length}, minmax(0, 1fr))`

  const hasAllDay = days.some((d) => getItemsForDay(items, d).some((i) => i.isAllDay))

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
      {/* Sticky header + all-day (single block, no gap) */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="grid" style={{ gridTemplateColumns: gridCols }}>
          <div />
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'px-2 py-2 text-center border-l border-border',
                  isToday && 'bg-primary/5',
                )}
              >
                <p className="text-[10px] uppercase text-muted-foreground tracking-wide">
                  {format(day, 'EEE', { locale: dateFnsLocale })}
                </p>
                <p className={cn('text-xl font-semibold', isToday ? 'text-primary' : 'text-foreground')}>
                  {format(day, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        {hasAllDay && (
          <div className="grid border-t border-border" style={{ gridTemplateColumns: gridCols }}>
            <div className="pr-2 py-1 text-right text-[9px] uppercase text-muted-foreground tracking-wide self-start pt-1">
              {t('allDay')}
            </div>
            {days.map((day) => {
              const allDay = getItemsForDay(items, day).filter((i) => i.isAllDay)
              return (
                <div
                  key={day.toISOString()}
                  className="border-l border-border p-1 space-y-0.5 min-h-[28px]"
                >
                  {allDay.map((item) => (
                    <AllDayChip key={item.id} item={item} />
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Time grid body */}
      <div
        className="grid relative"
        style={{ gridTemplateColumns: gridCols, height: TOTAL_HEIGHT }}
      >
        {/* Hour labels column */}
        <div className="relative">
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {i === 0 ? '' : format(new Date(2000, 0, 1, h), 'h a')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          const dayItems = getItemsForDay(items, day).filter((i) => !i.isAllDay)
          const laidOut = layoutItems(dayItems)

          return (
            <div
              key={day.toISOString()}
              className={cn('relative border-l border-border cursor-pointer', isToday && 'bg-primary/[0.03]')}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-event]')) return
                const rect = e.currentTarget.getBoundingClientRect()
                const y = e.clientY - rect.top
                const totalMinutes = (y / HOUR_HEIGHT) * 60
                const snapped = Math.floor(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES
                const start = new Date(day)
                start.setHours(0, 0, 0, 0)
                start.setMinutes(START_HOUR * 60 + snapped)
                onSlotClick(start)
              }}
            >
              {/* Hour lines */}
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}

              {/* Events */}
              {laidOut.map(({ item, col, cols }) => {
                const startHour = item.start.getHours() + item.start.getMinutes() / 60
                const durationMin = Math.max(differenceInMinutes(item.end, item.start), 15)
                const top = Math.max((startHour - START_HOUR) * HOUR_HEIGHT, 0)
                const height = Math.max((durationMin / 60) * HOUR_HEIGHT, 20)
                const colorClass = COLOR_BG[item.color] ?? 'bg-muted/50 border-l-muted-foreground'

                const widthPct = 100 / cols
                const leftPct = col * widthPct

                return (
                  <div
                    key={item.id}
                    data-event
                    onClick={(e) => { e.stopPropagation(); onItemClick(item, e.currentTarget) }}
                    className={cn(
                      'absolute rounded-md border-l-[3px] px-1.5 py-0.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow',
                      colorClass,
                    )}
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                    }}
                    title={`${item.title} (${format(item.start, 'h:mm a')} – ${format(item.end, 'h:mm a')})`}
                  >
                    <div className="flex items-start gap-1">
                      {item.status === 'completed' && (
                        <CheckIcon size={8} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-[11px] font-medium leading-tight line-clamp-2',
                          item.status === 'completed'
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                    {height >= 36 && (
                      <span className="text-[9px] text-muted-foreground">
                        {format(item.start, 'h:mm')}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Current time indicator */}
              {isToday && (() => {
                const nowHour = now.getHours() + now.getMinutes() / 60
                if (nowHour < START_HOUR || nowHour > END_HOUR) return null
                const top = (nowHour - START_HOUR) * HOUR_HEIGHT
                return (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top }}
                  >
                    <div className="h-0.5 bg-destructive" />
                    <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-destructive" />
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AllDayChip({ item }: { item: CalendarItem }) {
  const colorClass = COLOR_BG[item.color] ?? 'bg-muted/50 border-l-muted-foreground'
  return (
    <div
      className={cn(
        'rounded border-l-[3px] px-1.5 py-0.5 text-[11px] leading-tight truncate',
        colorClass,
        item.status === 'completed' && 'line-through text-muted-foreground',
      )}
      title={item.title}
    >
      {item.status === 'completed' && (
        <CheckIcon size={8} className="inline text-emerald-500 mr-0.5" />
      )}
      {item.title}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Month grid
// ---------------------------------------------------------------------------
function MonthGrid({
  currentDate,
  items,
  today,
  onDayClick,
}: {
  currentDate: Date
  items: CalendarItem[]
  today: Date
  onDayClick: (d: Date) => void
}) {
  const { t } = useTranslation('calendar')
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const days: Date[] = []
  let d = start
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  while (d <= end) {
    days.push(d)
    d = addDays(d, 1)
  }
  const rows = days.length / 7

  const headers = [t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')]

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
        {headers.map((h, i) => (
          <div
            key={h}
            className={cn(
              'px-2 py-1 text-center text-xs uppercase tracking-wide text-muted-foreground border-border',
              i > 0 && 'border-l',
            )}
          >
            {h}
          </div>
        ))}
      </div>
      <div
        className="grid flex-1 overflow-y-auto"
        style={{
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gridTemplateRows: `repeat(${rows}, minmax(100px, 1fr))`,
        }}
      >
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, today)
          const dayItems = getItemsForDay(items, day)
          const col = idx % 7
          const row = Math.floor(idx / 7)
          const isLastRow = row === rows - 1

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                'flex flex-col items-stretch border-border p-1 text-left hover:bg-muted/30 transition-colors overflow-hidden',
                col > 0 && 'border-l',
                !isLastRow && 'border-b',
                !isCurrentMonth && 'bg-muted/10',
              )}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday && 'bg-primary text-primary-foreground font-semibold',
                    !isToday && !isCurrentMonth && 'text-muted-foreground/40',
                    !isToday && isCurrentMonth && 'text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate',
                      COLOR_BG[item.color] ?? 'bg-muted',
                      item.status === 'completed' && 'line-through text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full flex-shrink-0',
                        DOT_COLORS[item.color] ?? 'bg-foreground/50',
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayItems.length - 3}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Simple overlap layout (column assignment)
// ---------------------------------------------------------------------------
function layoutItems(items: CalendarItem[]): Array<{ item: CalendarItem; col: number; cols: number }> {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime())
  const result: Array<{ item: CalendarItem; col: number; cols: number }> = []
  let cluster: typeof result = []
  let clusterEnd = 0

  function flush() {
    const cols = cluster.reduce((m, c) => Math.max(m, c.col + 1), 0)
    for (const c of cluster) c.cols = cols
    result.push(...cluster)
    cluster = []
  }

  for (const item of sorted) {
    const start = item.start.getTime()
    const end = item.end.getTime()
    if (cluster.length === 0 || start >= clusterEnd) {
      flush()
      cluster.push({ item, col: 0, cols: 1 })
      clusterEnd = end
      continue
    }
    const usedCols = new Set(
      cluster
        .filter((c) => c.item.end.getTime() > start)
        .map((c) => c.col),
    )
    let col = 0
    while (usedCols.has(col)) col++
    cluster.push({ item, col, cols: 1 })
    clusterEnd = Math.max(clusterEnd, end)
  }
  flush()
  return result
}
