import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { useTranslation } from 'react-i18next'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { useLocale } from '@/i18n/useLocale'
import { formatTime } from '@/i18n/format'

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
}

export function TaskCalendarView() {
  const { t } = useTranslation('tasks')
  const { locale, dateFnsLocale } = useLocale()
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const currentMonth = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset])
  const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery(tasksQueries.calendarView(start, end))

  // Build a map: date string → tasks
  const tasksByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    if (!data) return map
    if (Array.isArray(data)) {
      for (const entry of data) {
        map[entry.date] = [...(entry.allDay ?? []), ...(entry.timed ?? [])]
      }
    } else if (data.days) {
      for (const day of data.days) {
        map[day.date] = [...(day.allDay ?? []), ...(day.timed ?? [])]
      }
    }
    return map
  }, [data])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDayOfWeek = getDay(days[0]!)

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : []

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset((v) => v - 1)}>&#8249;</Button>
        <h3 className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: dateFnsLocale })}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset((v) => v + 1)}>&#8250;</Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Day headers */}
        {[7, 8, 9, 10, 11, 12, 13].map((d) => (
          <div key={d} className="bg-muted px-1 py-1.5 text-center text-[10px] font-medium text-muted-foreground">
            {format(new Date(2024, 0, d), 'EEE', { locale: dateFnsLocale })}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card p-1 min-h-[3rem]" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate[dateStr] ?? []
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`bg-card p-1 min-h-[3rem] text-left transition-colors hover:bg-muted/50 ${
                isSelected ? 'ring-2 ring-primary ring-inset' : ''
              }`}
            >
              <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {day.getDate()}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap">
                  {dayTasks.slice(0, 4).map((task: any, i: number) => (
                    <span
                      key={i}
                      className={`size-1.5 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-muted-foreground'}`}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="text-[8px] text-muted-foreground">+{dayTasks.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day tasks */}
      {selectedDate && (
        <Card>
          <CardContent className="p-3 space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground">
              {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMM d', { locale: dateFnsLocale })}
            </h4>
            {selectedTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{t('noTasksForDay', 'No tasks')}</p>
            ) : (
              selectedTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  <span className={`size-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-muted-foreground'}`} />
                  <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}>
                    {task.title}
                  </span>
                  {task.scheduledStart && (
                    <span className="text-muted-foreground ml-auto">
                      {formatTime(task.scheduledStart, locale)}
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && <div className="h-20 animate-pulse rounded bg-muted" />}
    </div>
  )
}
