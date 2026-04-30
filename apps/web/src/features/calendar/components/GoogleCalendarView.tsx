import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/Icons'
import { Button } from '@/shared/components/ui/button'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { useLocale } from '@/i18n/useLocale'
import { cn } from '@/shared/lib/utils'
import { useCalendarItems, type CalendarItem } from '../hooks/use-calendar-items'
import {
  TaskCalendarDialog,
  TaskQuickDialog,
  TaskQuickView,
} from '@/features/tasks/components/dialogs'
import { useUpdateTask, useDeleteTask } from '@/features/tasks/queries'
import { EventQuickView } from './EventQuickView'
import { EventEditDialog } from './EventEditDialog'
import type { Task } from '@repo/shared/types'
import { toast } from 'sonner'
import { useDeleteGoogleEvent } from '../queries'
import { TimeGrid } from './calendar-grid/TimeGrid'
import { MonthGrid } from './calendar-grid/MonthGrid'

type ViewMode = 'day' | 'week' | 'month'

function weekDays(d: Date): Date[] {
  const s = startOfWeek(d, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(s, i))
}

export function GoogleCalendarView() {
  const { t } = useTranslation('calendar')
  const { dateFnsLocale } = useLocale()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [mode, setMode] = useState<ViewMode>('week')
  const [slotDialog, setSlotDialog] = useState<{ start: Date; end: Date } | null>(null)
  const [eventCreateSlot, setEventCreateSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskQuickView, setTaskQuickView] = useState<{ task: Task; anchor: HTMLElement } | null>(null)
  const [eventQuickView, setEventQuickView] = useState<{ item: CalendarItem; anchor: HTMLElement } | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null)
  const deleteEvent = useDeleteGoogleEvent()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
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

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonList lines={6} />
          </div>
        ) : mode === 'month' ? (
          <MonthGrid
            currentDate={currentDate}
            items={items}
            today={today}
            onDayClick={(d) => {
              setCurrentDate(d)
              setMode('day')
            }}
          />
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
                setTaskQuickView({ task: item.task, anchor })
              } else if (item.type === 'event') {
                setEventQuickView({ item, anchor })
              }
            }}
          />
        )}
      </div>

      {slotDialog && (
        <TaskQuickDialog
          open
          onClose={() => setSlotDialog(null)}
          defaultDate={format(slotDialog.start, 'yyyy-MM-dd')}
          defaultStart={slotDialog.start.toISOString()}
          defaultEnd={slotDialog.end.toISOString()}
        />
      )}

      {editingTask && (
        <TaskCalendarDialog open onClose={() => setEditingTask(null)} task={editingTask} />
      )}

      <TaskQuickView
        task={taskQuickView?.task ?? null}
        anchorEl={taskQuickView?.anchor ?? null}
        open={!!taskQuickView}
        onClose={() => setTaskQuickView(null)}
        onEdit={() => {
          if (taskQuickView) {
            setEditingTask(taskQuickView.task)
            setTaskQuickView(null)
          }
        }}
        onDelete={async () => {
          if (!taskQuickView) return
          if (!window.confirm(t('confirmDelete', { ns: 'tasks', defaultValue: 'Delete this task?' }))) return
          try {
            await deleteTask.mutateAsync(taskQuickView.task.id)
            toast.success(t('taskDeleted', { ns: 'tasks' }))
            setTaskQuickView(null)
          } catch {
            toast.error(t('failedToDelete', { ns: 'tasks' }))
          }
        }}
        onToggleComplete={async () => {
          if (!taskQuickView) return
          const newStatus = taskQuickView.task.status === 'completed' ? 'open' : 'completed'
          try {
            await updateTask.mutateAsync({ id: taskQuickView.task.id, data: { status: newStatus } })
            setTaskQuickView(null)
          } catch {
            toast.error(t('failedToUpdate', { ns: 'tasks' }))
          }
        }}
      />

      <EventQuickView
        item={eventQuickView?.item ?? null}
        anchorEl={eventQuickView?.anchor ?? null}
        open={!!eventQuickView}
        onClose={() => setEventQuickView(null)}
        onEdit={() => {
          if (eventQuickView) {
            setEditingEvent(eventQuickView.item)
            setEventQuickView(null)
          }
        }}
        onDelete={async () => {
          if (!eventQuickView) return
          const it = eventQuickView.item
          if (!it.googleCalendarId || !it.googleEventId) return
          if (!window.confirm('Delete this event from Google Calendar?')) return
          try {
            await deleteEvent.mutateAsync({
              calendarId: it.googleCalendarId,
              eventId: it.googleEventId,
            })
            toast.success('Event deleted')
            setEventQuickView(null)
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete')
          }
        }}
      />

      {editingEvent && (
        <EventEditDialog open onClose={() => setEditingEvent(null)} item={editingEvent} />
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
