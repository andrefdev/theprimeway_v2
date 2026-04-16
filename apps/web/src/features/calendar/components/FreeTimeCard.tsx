import { useQuery } from '@tanstack/react-query'
import { calendarQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { useTranslation } from 'react-i18next'
import { format, addDays } from 'date-fns'

export function FreeTimeCard() {
  const { t } = useTranslation('common')
  const start = format(new Date(), 'yyyy-MM-dd')
  const end = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery(calendarQueries.freeTime(start, end))

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded bg-muted" />
  }

  if (!data) return null

  const { summary, days } = data as {
    summary: { avgFreeMinutesPerDay: number; busiestDay: string; freestDay: string; totalFreeHours: number }
    days: Array<{ date: string; totalFreeMinutes: number; totalBusyMinutes: number; eventCount: number }>
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t('freeTimeAnalysis')}</h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label={t('availableHours', { defaultValue: 'Free Hours' })} value={`${Math.round(summary.totalFreeHours)}h`} />
          <MiniStat label={t('avgPerDay', { defaultValue: 'Avg/Day' })} value={`${Math.round(summary.avgFreeMinutesPerDay)}m`} />
          <MiniStat label={t('busiestDay')} value={summary.busiestDay ? formatShortDate(summary.busiestDay) : '—'} />
          <MiniStat label={t('freestDay')} value={summary.freestDay ? formatShortDate(summary.freestDay) : '—'} />
        </div>

        {/* Day bars */}
        {days && days.length > 0 && (
          <div className="flex items-end gap-1 h-12">
            {days.map((day) => {
              const total = day.totalFreeMinutes + day.totalBusyMinutes
              const freePct = total > 0 ? (day.totalFreeMinutes / total) * 100 : 100
              return (
                <div key={day.date} className="flex-1 flex flex-col gap-px h-full" title={`${day.date}: ${day.totalFreeMinutes}m free`}>
                  <div className="flex-1 bg-emerald-500/30 rounded-t-sm" style={{ height: `${freePct}%` }} />
                  <div className="bg-red-500/20 rounded-b-sm" style={{ height: `${100 - freePct}%` }} />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

function formatShortDate(dateStr: string) {
  try {
    return format(new Date(dateStr + 'T00:00:00'), 'EEE')
  } catch {
    return dateStr
  }
}
