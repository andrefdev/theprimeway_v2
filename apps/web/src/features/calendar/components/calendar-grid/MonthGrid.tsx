import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { cn } from '@/shared/lib/utils'
import { getItemsForDay, type CalendarItem } from '../../hooks/use-calendar-items'
import { COLOR_BG, DOT_COLORS } from './constants'

interface MonthGridProps {
  currentDate: Date
  items: CalendarItem[]
  today: Date
  onDayClick: (d: Date) => void
}

export function MonthGrid({ currentDate, items, today, onDayClick }: MonthGridProps) {
  const { t } = useTranslation('calendar')

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    const out: Date[] = []
    let d = start
    while (d <= end) {
      out.push(d)
      d = addDays(d, 1)
    }
    return out
  }, [currentDate])
  const rows = days.length / 7

  const dayBuckets = useMemo(
    () => days.map((day) => ({ day, items: getItemsForDay(items, day) })),
    [days, items],
  )

  const headers = [
    t('dayMon'),
    t('dayTue'),
    t('dayWed'),
    t('dayThu'),
    t('dayFri'),
    t('daySat'),
    t('daySun'),
  ]

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
        {dayBuckets.map(({ day, items: dayItems }, idx) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, today)
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
