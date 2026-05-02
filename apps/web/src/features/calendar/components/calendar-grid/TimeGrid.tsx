import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInMinutes, format, isSameDay } from 'date-fns'
import { CheckIcon } from '@/shared/components/Icons'
import { useLocale } from '@/i18n/useLocale'
import { cn } from '@/shared/lib/utils'
import { getItemsForDay, type CalendarItem } from '../../hooks/use-calendar-items'
import { resolveItemColor, withAlpha } from '../../lib/colors'
import {
  HOUR_HEIGHT,
  HOURS,
  LABEL_WIDTH,
  SLOT_MINUTES,
  START_HOUR,
  END_HOUR,
  TOTAL_HEIGHT,
  layoutItems,
} from './constants'

interface TimeGridProps {
  days: Date[]
  items: CalendarItem[]
  today: Date
  onSlotClick: (start: Date) => void
  onItemClick: (item: CalendarItem, anchor: HTMLElement) => void
}

export function TimeGrid({ days, items, today, onSlotClick, onItemClick }: TimeGridProps) {
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

  const dayBuckets = useMemo(
    () =>
      days.map((day) => {
        const dayItems = getItemsForDay(items, day)
        const allDay = dayItems.filter((i) => i.isAllDay)
        const timed = dayItems.filter((i) => !i.isAllDay)
        return { day, allDay, timed, laidOut: layoutItems(timed) }
      }),
    [days, items],
  )

  const hasAllDay = useMemo(() => dayBuckets.some((b) => b.allDay.length > 0), [dayBuckets])

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
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
                <p
                  className={cn(
                    'text-xl font-semibold',
                    isToday ? 'text-primary' : 'text-foreground',
                  )}
                >
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
            {dayBuckets.map(({ day, allDay }) => (
              <div
                key={day.toISOString()}
                className="border-l border-border p-1 space-y-0.5 min-h-[28px]"
              >
                {allDay.map((item) => (
                  <AllDayChip key={item.id} item={item} onItemClick={onItemClick} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="grid relative"
        style={{ gridTemplateColumns: gridCols, height: TOTAL_HEIGHT }}
      >
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

        {dayBuckets.map(({ day, laidOut }) => {
          const isToday = isSameDay(day, today)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'relative border-l border-border cursor-pointer',
                isToday && 'bg-primary/[0.03]',
              )}
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
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}

              {laidOut.map(({ item, col, cols }) => {
                const startHour = item.start.getHours() + item.start.getMinutes() / 60
                const durationMin = Math.max(differenceInMinutes(item.end, item.start), 15)
                const top = Math.max((startHour - START_HOUR) * HOUR_HEIGHT, 0)
                const height = Math.max((durationMin / 60) * HOUR_HEIGHT, 20)
                const hex = resolveItemColor(item)
                const widthPct = 100 / cols
                const leftPct = col * widthPct

                return (
                  <div
                    key={item.id}
                    data-event
                    onClick={(e) => {
                      e.stopPropagation()
                      onItemClick(item, e.currentTarget)
                    }}
                    className="absolute rounded-md border-l-[3px] px-1.5 py-0.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: withAlpha(hex),
                      borderLeftColor: hex,
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

              {isToday && (() => {
                const nowHour = now.getHours() + now.getMinutes() / 60
                if (nowHour < START_HOUR || nowHour > END_HOUR) return null
                const top = (nowHour - START_HOUR) * HOUR_HEIGHT
                return (
                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top }}>
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

function AllDayChip({
  item,
  onItemClick,
}: {
  item: CalendarItem
  onItemClick: (item: CalendarItem, anchor: HTMLElement) => void
}) {
  const hex = resolveItemColor(item)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onItemClick(item, e.currentTarget)
      }}
      style={{
        backgroundColor: withAlpha(hex),
        borderLeftColor: hex,
      }}
      className={cn(
        'w-full text-left rounded border-l-[3px] px-1.5 py-0.5 text-[11px] leading-tight truncate cursor-pointer hover:shadow-md transition-shadow',
        item.status === 'completed' && 'line-through text-muted-foreground',
      )}
      title={item.title}
    >
      {item.status === 'completed' && (
        <CheckIcon size={8} className="inline text-emerald-500 mr-0.5" />
      )}
      {item.title}
    </button>
  )
}
