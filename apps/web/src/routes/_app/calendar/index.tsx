import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, format } from 'date-fns'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/Icons'
import { CalendarNav } from '@/features/calendar/components/CalendarNav'
import { DayPlannerView } from '@/features/calendar/components/DayPlannerView'
import { useLocale } from '@/i18n/useLocale'

export const Route = createFileRoute('/_app/calendar/')({
  component: CalendarDayPage,
})

function CalendarDayPage() {
  const { t } = useTranslation('calendar')
  const { dateFnsLocale } = useLocale()
  const [day, setDay] = useState(() => new Date())

  return (
    <div>
      <SectionHeader sectionId="calendar" title={t('title')} />
      <CalendarNav />
      <div className="mx-auto w-full px-6 pb-6 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {format(day, 'EEEE, MMMM d', { locale: dateFnsLocale })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDay((d) => addDays(d, -1))}>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDay(new Date())}
              className="text-xs"
            >
              {t('today')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDay((d) => addDays(d, 1))}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <DayPlannerView day={day} />
      </div>
    </div>
  )
}
