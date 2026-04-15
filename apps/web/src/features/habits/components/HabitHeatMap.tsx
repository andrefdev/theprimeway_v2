import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DailyData {
  date: string
  completionRate: number
}

interface HabitHeatMapProps {
  data: DailyData[]
  /** Number of days to show (default 365) */
  days?: number
}

function getColorClass(rate: number): string {
  if (rate <= 0) return 'bg-muted'
  if (rate <= 25) return 'bg-emerald-200 dark:bg-emerald-900'
  if (rate <= 50) return 'bg-emerald-400 dark:bg-emerald-700'
  if (rate <= 75) return 'bg-emerald-500 dark:bg-emerald-500'
  return 'bg-emerald-600 dark:bg-emerald-400'
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function HabitHeatMap({ data, days = 365 }: HabitHeatMapProps) {
  const { t, i18n } = useTranslation('habits')

  const { weeks, monthLabels } = useMemo(() => {
    // Build a lookup map from date string to completion rate
    const dataMap = new Map<string, number>()
    for (const d of data) {
      dataMap.set(d.date, d.completionRate)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the start date: go back `days` days, then back to the previous Monday
    const start = new Date(today)
    start.setDate(start.getDate() - days + 1)
    // Adjust to previous Monday (getDay: 0=Sun,1=Mon,...6=Sat)
    const dayOfWeek = start.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    start.setDate(start.getDate() - diff)

    // Build weeks (columns). Each week is an array of 7 days (Mon=0 .. Sun=6)
    const weeksArr: Array<Array<{ date: Date; dateStr: string; rate: number; inRange: boolean }>> = []
    const cursor = new Date(start)
    const rangeStart = new Date(today)
    rangeStart.setDate(rangeStart.getDate() - days + 1)

    while (cursor <= today) {
      const week: Array<{ date: Date; dateStr: string; rate: number; inRange: boolean }> = []
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(cursor)
        const dateStr = formatDate(d)
        const inRange = d >= rangeStart && d <= today
        week.push({
          date: d,
          dateStr,
          rate: inRange ? (dataMap.get(dateStr) ?? 0) : -1,
          inRange,
        })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeksArr.push(week)
    }

    // Build month labels with their column positions
    const labels: Array<{ label: string; col: number }> = []
    let lastMonth = -1
    for (let wi = 0; wi < weeksArr.length; wi++) {
      // Use the first in-range day of the week for the month label
      const weekDays = weeksArr[wi]
      if (!weekDays) continue
      const firstDay = weekDays.find((d) => d.inRange)
      if (!firstDay) continue
      const month = firstDay.date.getMonth()
      if (month !== lastMonth) {
        labels.push({
          label: firstDay.date.toLocaleString(i18n.language, { month: 'short' }),
          col: wi,
        })
        lastMonth = month
      }
    }

    return { weeks: weeksArr, monthLabels: labels }
  }, [data, days, i18n.language])

  const dayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
    // Monday=1, Wednesday=3, Friday=5 (JS Date: Mon=1, Wed=3, Fri=5)
    // We display rows as Mon(0) Tue(1) Wed(2) Thu(3) Fri(4) Sat(5) Sun(6)
    // Show labels for rows 0(Mon), 2(Wed), 4(Fri)
    const base = new Date(2024, 0, 1) // A known Monday
    return [0, 2, 4].map((row) => {
      const d = new Date(base)
      d.setDate(d.getDate() + row)
      return { row, label: formatter.format(d) }
    })
  }, [i18n.language])

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">{t('heatMap')}</p>
          <p className="text-sm text-muted-foreground text-center py-6">{t('heatMapEmpty')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">{t('heatMap')}</p>

        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-0.5" style={{ minWidth: 'max-content' }}>
            {/* Month labels row */}
            <div className="flex gap-0.5 ml-7">
              {(() => {
                const cells: React.ReactNode[] = []
                let nextLabelIdx = 0
                for (let wi = 0; wi < weeks.length; wi++) {
                  const nextLabel = monthLabels[nextLabelIdx]
                  if (nextLabel && nextLabel.col === wi) {
                    cells.push(
                      <span
                        key={`month-${wi}`}
                        className="text-[9px] text-muted-foreground leading-none"
                        style={{ width: 11, flexShrink: 0 }}
                      >
                        {nextLabel.label}
                      </span>,
                    )
                    nextLabelIdx++
                  } else {
                    cells.push(
                      <span key={`empty-${wi}`} style={{ width: 11, flexShrink: 0 }} />,
                    )
                  }
                }
                return cells
              })()}
            </div>

            {/* Grid: 7 rows (Mon-Sun) */}
            <div className="flex gap-0">
              {/* Day labels column */}
              <div className="flex flex-col gap-0.5 mr-1" style={{ width: 24 }}>
                {Array.from({ length: 7 }).map((_, row) => {
                  const dayLabel = dayLabels.find((dl) => dl.row === row)
                  return (
                    <div
                      key={row}
                      className="flex items-center justify-end"
                      style={{ height: 11 }}
                    >
                      {dayLabel && (
                        <span className="text-[9px] text-muted-foreground leading-none">
                          {dayLabel.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Cells grid */}
              <TooltipProvider delayDuration={100}>
                <div className="flex gap-0.5">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                      {week.map((day, di) => {
                        if (!day.inRange) {
                          return (
                            <div
                              key={di}
                              className="rounded-[2px]"
                              style={{ width: 11, height: 11 }}
                            />
                          )
                        }

                        const rateRounded = Math.round(day.rate)
                        const displayDate = day.date.toLocaleDateString(i18n.language, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })

                        return (
                          <Tooltip key={di}>
                            <TooltipTrigger asChild>
                              <div
                                className={`rounded-[2px] ${getColorClass(day.rate)} transition-colors`}
                                style={{ width: 11, height: 11 }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>
                                {displayDate}: {rateRounded}%
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-2">
              <span className="text-[9px] text-muted-foreground">{t('lessActive')}</span>
              <div className="rounded-[2px] bg-muted" style={{ width: 11, height: 11 }} />
              <div
                className="rounded-[2px] bg-emerald-200 dark:bg-emerald-900"
                style={{ width: 11, height: 11 }}
              />
              <div
                className="rounded-[2px] bg-emerald-400 dark:bg-emerald-700"
                style={{ width: 11, height: 11 }}
              />
              <div
                className="rounded-[2px] bg-emerald-500 dark:bg-emerald-500"
                style={{ width: 11, height: 11 }}
              />
              <div
                className="rounded-[2px] bg-emerald-600 dark:bg-emerald-400"
                style={{ width: 11, height: 11 }}
              />
              <span className="text-[9px] text-muted-foreground">{t('moreActive')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
