import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/useLocale'
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/Icons'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Button } from '@/shared/components/ui/button'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { MonthView } from '@/features/calendar/components/MonthView'
import { WeekView } from '@/features/calendar/components/WeekView'
import { DayDetail } from '@/features/calendar/components/DayDetail'
import { useCalendarItems } from '@/features/calendar/hooks/use-calendar-items'
import { FreeTimeCard } from '@/features/calendar/components/FreeTimeCard'
import { TimeBlockSuggestions } from '@/features/calendar/components/TimeBlockSuggestions'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
} from 'date-fns'
import { useState } from 'react'

export const Route = createFileRoute('/_app/calendar')({
  component: CalendarPage,
})

type CalendarViewMode = 'month' | 'week'

function CalendarPage() {
  const { t } = useTranslation('calendar')
  const { dateFnsLocale } = useLocale()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarViewMode>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  // Compute date range for data fetching
  const rangeStart = view === 'month'
    ? startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    : startOfWeek(currentDate, { weekStartsOn: 1 })
  const rangeEnd = view === 'month'
    ? endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    : addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6)

  const dateRange = {
    from: format(rangeStart, 'yyyy-MM-dd'),
    to: format(rangeEnd, 'yyyy-MM-dd'),
  }

  const { items, isLoading } = useCalendarItems(dateRange)

  function handlePrev() {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -7))
    }
  }

  function handleNext() {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 7))
    }
  }

  function handleToday() {
    setCurrentDate(new Date())
    setSelectedDay(new Date())
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day)
  }

  return (
    <div>
      <SectionHeader sectionId="calendar" title={t('title')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'W'w — MMMM yyyy", { locale: dateFnsLocale })}
          </h2>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t('viewMonth')}
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                  view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t('viewWeek')}
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrev}>
                <ChevronLeftIcon />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs">
                {t('today')}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext}>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>

        {isLoading && <SkeletonList lines={6} />}

        {!isLoading && (
          <>
            {view === 'month' ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <MonthView
                  currentDate={currentDate}
                  items={items}
                  selectedDay={selectedDay}
                  onDayClick={handleDayClick}
                />
                {selectedDay && (
                  <DayDetail day={selectedDay} items={items} />
                )}
              </div>
            ) : (
              <WeekView
                currentDate={currentDate}
                items={items}
                onDayClick={handleDayClick}
              />
            )}
          </>
        )}

        {/* AI Calendar Features */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FreeTimeCard />
          <TimeBlockSuggestions />
        </div>
      </div>
    </div>
  )
}
