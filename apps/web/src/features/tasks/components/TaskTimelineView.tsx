import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'
import { Badge } from '@/shared/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { format, addDays } from 'date-fns'
import { useLocale } from '@/i18n/useLocale'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-blue-500',
}

export function TaskTimelineView() {
  const { t } = useTranslation('tasks')
  const { dateFnsLocale } = useLocale()

  const start = format(new Date(), 'yyyy-MM-dd')
  const end = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery(tasksQueries.timelineView(start, end))

  const entries = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (data.entries) return data.entries
    return []
  }, [data])

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded bg-muted" />
  }

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t('noTasksForDay', 'No scheduled tasks')}</p>
  }

  return (
    <div className="space-y-1">
      {entries.map((entry: any, i: number) => {
        if (entry.type === 'gap' || entry.type === 'free') {
          return (
            <div key={`gap-${i}`} className="flex items-center gap-2 py-1 px-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground">
                {entry.durationMinutes ? t('minutesFree', { defaultValue: '{{count}}min free', count: entry.durationMinutes }) : t('free', { defaultValue: 'free' })}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )
        }

        const task = entry.task ?? entry
        const borderColor = PRIORITY_COLORS[task.priority] ?? 'border-l-muted-foreground'

        return (
          <div
            key={task.id ?? `entry-${i}`}
            className={`rounded border-l-4 ${borderColor} bg-card border border-border/50 px-3 py-2`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </span>
              {task.priority && (
                <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
              )}
            </div>
            {(task.scheduledStart || task.scheduledDate) && (
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                {task.scheduledStart && (
                  <span>
                    {new Date(task.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {task.scheduledEnd && (
                      <> - {new Date(task.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </span>
                )}
                {task.scheduledDate && (
                  <span>{format(new Date(task.scheduledDate), 'EEE, MMM d', { locale: dateFnsLocale })}</span>
                )}
                {task.estimatedDuration && (
                  <Badge variant="outline" className="text-[9px]">{task.estimatedDuration}m</Badge>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
