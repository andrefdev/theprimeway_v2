import { Card, CardContent } from '@/shared/components/ui/card'
import { useLocale } from '@/i18n/useLocale'
import { useTranslation } from 'react-i18next'
import { startOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns'
import type { CalendarItem } from '../hooks/use-calendar-items'
import { getItemsForDay } from '../hooks/use-calendar-items'

const DOT_COLORS: Record<string, string> = {
  red: 'bg-destructive',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
}

interface MonthViewProps {
  currentDate: Date
  items: CalendarItem[]
  selectedDay: Date | null
  onDayClick: (day: Date) => void
}

export function MonthView({ currentDate, items, selectedDay, onDayClick }: MonthViewProps) {
  const { t } = useTranslation('calendar')
  const { dateFnsLocale } = useLocale()
  const today = new Date()

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: dateFnsLocale })
  const calendarDays: Date[] = []
  let d = calendarStart
  while (calendarDays.length < 42) {
    calendarDays.push(d)
    d = addDays(d, 1)
  }

  const dayHeaders = [
    t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'),
    t('dayFri'), t('daySat'), t('daySun'),
  ]

  return (
    <Card>
      <CardContent className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayHeaders.map((day) => (
            <div key={day} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, today)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const dayItems = getItemsForDay(items, day)
            const hasItems = dayItems.length > 0

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onDayClick(day)}
                className={`relative flex flex-col items-center justify-start rounded-lg p-1 min-h-[52px] transition-colors ${
                  isSelected
                    ? 'bg-primary/15 ring-1 ring-primary'
                    : isToday
                      ? 'bg-primary text-primary-foreground font-bold'
                      : isCurrentMonth
                        ? 'text-foreground hover:bg-muted'
                        : 'text-muted-foreground/40'
                }`}
              >
                <span className="text-sm">{day.getDate()}</span>
                {/* Event dots */}
                {hasItems && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[32px]">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[item.color] ?? 'bg-foreground/50'}`}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[8px] text-muted-foreground leading-none">+{dayItems.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
