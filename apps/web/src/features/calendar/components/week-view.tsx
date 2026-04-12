import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckIcon } from '@/components/icons'
import { useLocale } from '@/i18n/useLocale'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  differenceInMinutes,
} from 'date-fns'
import type { CalendarItem } from '../hooks/use-calendar-items'
import { getItemsForDay } from '../hooks/use-calendar-items'

const HOUR_HEIGHT = 48 // px per hour
const START_HOUR = 6
const END_HOUR = 22

const COLOR_BG: Record<string, string> = {
  red: 'bg-destructive/15 border-l-destructive',
  yellow: 'bg-yellow-500/15 border-l-yellow-500',
  blue: 'bg-blue-500/15 border-l-blue-500',
  green: 'bg-emerald-500/15 border-l-emerald-500',
  purple: 'bg-violet-500/15 border-l-violet-500',
}

interface WeekViewProps {
  currentDate: Date
  items: CalendarItem[]
  onDayClick?: (day: Date) => void
}

export function WeekView({ currentDate, items, onDayClick }: WeekViewProps) {
  const { dateFnsLocale } = useLocale()
  const today = new Date()
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const totalHeight = hours.length * HOUR_HEIGHT

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2" />
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            const dayItems = getItemsForDay(items, day)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onDayClick?.(day)}
                className={`p-2 text-center border-l border-border transition-colors hover:bg-muted/40 ${
                  isToday ? 'bg-primary/5' : ''
                }`}
              >
                <p className="text-[10px] text-muted-foreground uppercase">
                  {format(day, 'EEE', { locale: dateFnsLocale })}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </p>
                {dayItems.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] mt-0.5">
                    {dayItems.length}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Time grid */}
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: totalHeight }}>
            {/* Hour labels */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 w-[60px] pr-2 text-right"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-muted-foreground -translate-y-1/2 block">
                  {format(new Date(2000, 0, 1, hour), 'h a')}
                </span>
              </div>
            ))}

            {/* Hour lines */}
            {hours.map((hour) => (
              <div
                key={`line-${hour}`}
                className="absolute left-[60px] right-0 border-t border-border/50"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              />
            ))}

            {/* Day columns with events */}
            {days.map((day, dayIdx) => {
              const dayItems = getItemsForDay(items, day).filter((i) => !i.isAllDay)

              return (
                <div
                  key={day.toISOString()}
                  className="absolute border-l border-border/30"
                  style={{
                    left: `calc(60px + ${(dayIdx / 7) * 100}% * 7 / 7)`,
                    width: `calc((100% - 60px) / 7)`,
                    top: 0,
                    height: totalHeight,
                  }}
                >
                  {dayItems.map((item) => {
                    const startHour = item.start.getHours() + item.start.getMinutes() / 60
                    const durationMin = Math.max(differenceInMinutes(item.end, item.start), 15)
                    const top = Math.max((startHour - START_HOUR) * HOUR_HEIGHT, 0)
                    const height = Math.max((durationMin / 60) * HOUR_HEIGHT, 20)
                    const colorClass = COLOR_BG[item.color] ?? 'bg-muted/50 border-l-muted-foreground'

                    return (
                      <div
                        key={item.id}
                        className={`absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-1.5 py-0.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${colorClass}`}
                        style={{ top, height }}
                        title={`${item.title} (${format(item.start, 'h:mm a')} – ${format(item.end, 'h:mm a')})`}
                      >
                        <div className="flex items-start gap-1">
                          {item.status === 'completed' && (
                            <CheckIcon size={8} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={`text-[10px] font-medium leading-tight line-clamp-2 ${
                            item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {item.title}
                          </span>
                        </div>
                        {durationMin >= 30 && (
                          <span className="text-[8px] text-muted-foreground">
                            {format(item.start, 'h:mm')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Current time indicator */}
            {days.some((d) => isSameDay(d, today)) && (() => {
              const now = new Date()
              const nowHour = now.getHours() + now.getMinutes() / 60
              if (nowHour < START_HOUR || nowHour > END_HOUR) return null
              const top = (nowHour - START_HOUR) * HOUR_HEIGHT
              const todayIdx = days.findIndex((d) => isSameDay(d, today))

              return (
                <div
                  className="absolute h-0.5 bg-destructive z-10"
                  style={{
                    top,
                    left: `calc(60px + ${(todayIdx / 7) * 100}% * 7 / 7)`,
                    width: `calc((100% - 60px) / 7)`,
                  }}
                >
                  <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                </div>
              )
            })()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
