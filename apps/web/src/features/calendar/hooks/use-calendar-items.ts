import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '@/features/tasks/queries'
import { calendarQueries } from '../queries'
import { format, addMinutes, parseISO } from 'date-fns'
import type { Task } from '@repo/shared/types'
import type { CalendarEvent } from '@repo/shared/types'

export interface EventAttendee {
  email: string
  displayName?: string
  responseStatus?: string
}

export interface CalendarItem {
  id: string
  title: string
  start: Date
  end: Date
  isAllDay: boolean
  color: string
  type: 'task' | 'event'
  status?: string
  priority?: string
  task?: Task
  // Google event details (populated when type === 'event')
  googleEventId?: string
  googleCalendarId?: string
  calendarName?: string
  description?: string
  location?: string
  attendees?: EventAttendee[]
  hangoutLink?: string
  htmlLink?: string
  colorId?: string
  organizer?: { email?: string; displayName?: string }
  visibility?: string
  /** Google calendar access role: 'owner' | 'writer' | 'reader' | 'freeBusyReader'. */
  calendarAccessRole?: string | null
  /** True when this event lives on a read-only calendar (e.g. holidays). */
  isReadOnly?: boolean
}

/**
 * Merges tasks (that have scheduled dates) with Google Calendar events
 * into a unified list of CalendarItems for display.
 */
export function useCalendarItems(dateRange: { from: string; to: string }) {
  const tasksQuery = useQuery(
    tasksQueries.list({
      filter: 'week',
      weekStart: dateRange.from,
      weekEnd: dateRange.to,
      limit: '500',
    }),
  )
  const eventsQuery = useQuery(
    calendarQueries.googleEvents({
      timeMin: `${dateRange.from}T00:00:00.000Z`,
      timeMax: `${dateRange.to}T23:59:59.999Z`,
    }),
  )

  const items = useMemo<CalendarItem[]>(() => {
    const result: CalendarItem[] = []

    // Tasks → calendar items. Only tasks with an explicit scheduledStart are
    // placed on the grid; unscheduled tasks (or all-day) live in their list view
    // and must not pollute the time grid.
    const tasks = (tasksQuery.data?.data ?? []) as Task[]
    for (const task of tasks) {
      if (!task.scheduledStart) continue

      const start = parseISO(task.scheduledStart)
      const end = task.scheduledEnd ? parseISO(task.scheduledEnd) : addMinutes(start, task.estimatedDuration ?? 30)

      if (isNaN(start.getTime())) continue

      const colorMap: Record<string, string> = { high: 'red', medium: 'yellow', low: 'blue' }

      result.push({
        id: `task-${task.id}`,
        title: task.title,
        start,
        end,
        isAllDay: false,
        color: colorMap[task.priority] ?? 'green',
        type: 'task',
        status: task.status,
        priority: task.priority,
        task,
      })
    }

    // Google Calendar events. Backend currently returns Google's raw shape
    // (start.dateTime / end.dateTime / summary / id), not the typed CalendarEvent
    // shape — normalize defensively to handle both.
    const events = (eventsQuery.data?.data ?? []) as Array<CalendarEvent | Record<string, any>>
    for (const event of events) {
      const ev = event as any
      const startStr: string | undefined =
        ev.startTime ??
        ev.start?.dateTime ??
        (ev.start?.date ? `${ev.start.date}T00:00:00` : undefined)
      const endStr: string | undefined =
        ev.endTime ??
        ev.end?.dateTime ??
        (ev.end?.date ? `${ev.end.date}T23:59:59` : undefined)
      if (!startStr || !endStr) continue

      const start = parseISO(startStr)
      const end = parseISO(endStr)
      if (isNaN(start.getTime())) continue

      const id: string = ev.id ?? `${startStr}-${ev.summary ?? ev.title ?? 'event'}`
      const title: string = ev.title ?? ev.summary ?? '(untitled)'
      const isAllDay: boolean = ev.isAllDay ?? Boolean(ev.start?.date && !ev.start?.dateTime)
      const color: string = ev.color ?? ev.calendarColor ?? 'purple'

      const accessRole = (ev as any).calendarAccessRole as string | null | undefined
      const isReadOnly = Boolean(
        accessRole && accessRole !== 'owner' && accessRole !== 'writer',
      )

      result.push({
        id: `event-${id}`,
        title,
        start,
        end,
        isAllDay,
        color,
        type: 'event',
        googleEventId: ev.id,
        googleCalendarId: ev.calendarId,
        calendarName: ev.calendarName,
        description: ev.description,
        location: ev.location,
        attendees: Array.isArray(ev.attendees)
          ? (ev.attendees as any[]).map((a) => ({
              email: a.email,
              displayName: a.displayName,
              responseStatus: a.responseStatus,
            }))
          : undefined,
        hangoutLink: ev.hangoutLink,
        htmlLink: ev.htmlLink,
        colorId: ev.colorId,
        organizer: ev.organizer,
        visibility: ev.visibility,
        calendarAccessRole: accessRole ?? null,
        isReadOnly,
      })
    }

    return result.sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [tasksQuery.data, eventsQuery.data])

  return {
    items,
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError || eventsQuery.isError,
  }
}

/** Get items for a specific day */
export function getItemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const dayStr = format(day, 'yyyy-MM-dd')
  return items.filter((item) => format(item.start, 'yyyy-MM-dd') === dayStr)
}
