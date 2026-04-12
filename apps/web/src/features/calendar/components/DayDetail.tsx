import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CheckIcon } from '@/components/Icons'
import { useLocale } from '@/i18n/useLocale'
import { useTranslation } from 'react-i18next'
import { format, isToday, isTomorrow } from 'date-fns'
import type { CalendarItem } from '../hooks/use-calendar-items'
import { getItemsForDay } from '../hooks/use-calendar-items'

const COLOR_STYLES: Record<string, string> = {
  red: 'border-l-destructive bg-destructive/5',
  yellow: 'border-l-yellow-500 bg-yellow-500/5',
  blue: 'border-l-blue-500 bg-blue-500/5',
  green: 'border-l-emerald-500 bg-emerald-500/5',
  purple: 'border-l-violet-500 bg-violet-500/5',
}

interface DayDetailProps {
  day: Date
  items: CalendarItem[]
}

export function DayDetail({ day, items }: DayDetailProps) {
  const { t } = useTranslation('calendar')
  const { dateFnsLocale } = useLocale()
  const dayItems = getItemsForDay(items, day)
  const timedItems = dayItems.filter((i) => !i.isAllDay)
  const allDayItems = dayItems.filter((i) => i.isAllDay)

  function formatDayLabel(d: Date): string {
    if (isToday(d)) return t('today')
    if (isTomorrow(d)) return t('tomorrow')
    return format(d, 'EEEE', { locale: dateFnsLocale })
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{formatDayLabel(day)}</h3>
        <p className="text-xs text-muted-foreground">
          {format(day, 'MMMM d, yyyy', { locale: dateFnsLocale })}
          {dayItems.length > 0 && ` — ${dayItems.length} ${dayItems.length === 1 ? t('item') : t('items')}`}
        </p>
      </div>

      {dayItems.length === 0 ? (
        <EmptyState title={t('nothingScheduled')} description={t('nothingScheduledDescription')} />
      ) : (
        <div className="space-y-2">
          {/* All-day items */}
          {allDayItems.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t('allDay')}
              </span>
              {allDayItems.map((item) => (
                <EventRow key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Timed items */}
          {timedItems.length > 0 && (
            <div className="space-y-1">
              {allDayItems.length > 0 && (
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t('scheduled')}
                </span>
              )}
              {timedItems.map((item) => (
                <EventRow key={item.id} item={item} showTime />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventRow({ item, showTime = false }: { item: CalendarItem; showTime?: boolean }) {
  const isDone = item.status === 'completed'
  const colorStyle = COLOR_STYLES[item.color] ?? 'border-l-foreground/30 bg-muted/30'

  return (
    <Card className={`border-l-4 ${colorStyle} transition-colors hover:bg-muted/40`}>
      <CardContent className="flex items-center gap-2.5 p-2.5">
        {isDone && <CheckIcon size={12} className="text-emerald-500 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {item.title}
          </p>
          {showTime && (
            <p className="text-[10px] text-muted-foreground">
              {format(item.start, 'h:mm a')} – {format(item.end, 'h:mm a')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px]">
            {item.type === 'task' ? 'Task' : 'Event'}
          </Badge>
          {item.priority && (
            <Badge
              variant={item.priority === 'high' ? 'destructive' : 'outline'}
              className="text-[9px]"
            >
              {item.priority}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
