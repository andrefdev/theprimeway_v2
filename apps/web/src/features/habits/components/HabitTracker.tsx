import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Badge } from '@/shared/components/ui/badge'
import type { Habit } from '@repo/shared/types'
import { LIFE_PILLARS, CATEGORY_TO_PILLAR } from '@repo/shared/constants'
import { useTranslation } from 'react-i18next'

// Map pillar id to i18n key: health_body -> pillarHealthBody
const pillarI18nKey = (id: string) =>
  'pillar' + id.split('_').map(w => w[0]!.toUpperCase() + w.slice(1)).join('')

interface HabitTrackerProps {
  habits: Habit[]
  onToggle: (habit: Habit, date: string) => void
  onEdit: (habit: Habit) => void
}

export function HabitTracker({ habits, onToggle, onEdit }: HabitTrackerProps) {
  const { t } = useTranslation('habits')

  const dates = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight in local timezone
    const todayKey = format(today, 'yyyy-MM-dd')

    // Get all days of the current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const result = []
    let current = new Date(firstDay)

    while (current <= lastDay) {
      const dateKey = format(current, 'yyyy-MM-dd')
      const isFuture = current > today
      result.push({
        date: new Date(current),
        key: dateKey,
        label: format(current, 'd'),
        dayName: format(current, 'EEE').charAt(0),
        isToday: dateKey === todayKey,
        isFuture,
      })
      current.setDate(current.getDate() + 1)
    }

    return result
  }, [])

  if (habits.length === 0) return null

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <ScrollArea className="w-full">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="sticky left-0 z-10 bg-muted/30 px-3 py-2 text-left font-medium text-muted-foreground min-w-35">
                {t('habit')}
              </th>
              {dates.map((d) => (
                <th
                  key={d.key}
                  className={`px-1 py-2 text-center font-normal min-w-8 transition-colors ${
                    d.isToday
                      ? 'bg-primary/10 border-r-2 border-primary/40'
                      : d.isFuture
                        ? 'bg-muted/15'
                        : ''
                  }`}
                >
                  <div className={`text-[10px] ${d.isFuture ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{d.dayName}</div>
                  <div className={`text-[11px] ${d.isToday ? 'text-primary font-bold' : d.isFuture ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                    {d.label}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium text-muted-foreground min-w-12.5">
                {t('streak')}
              </th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                dates={dates}
                onToggle={onToggle}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Habit row
// ---------------------------------------------------------------------------
interface DateInfo {
  date: Date
  key: string
  label: string
  dayName: string
  isToday: boolean
}

function HabitRow({
  habit,
  dates,
  onToggle,
  onEdit,
}: {
  habit: Habit
  dates: DateInfo[]
  onToggle: (habit: Habit, date: string) => void
  onEdit: (habit: Habit) => void
}) {
  const { t } = useTranslation('habits')
  const logs = habit.logs ?? []
  const streak = computeStreak(habit, logs)

  function getLogForDate(dateKey: string) {
    return logs.find((l) => l.date.startsWith(dateKey))
  }

  function isDayApplicable(date: Date): boolean {
    if (habit.frequencyType === 'daily') return true
    if (habit.frequencyType === 'week_days') {
      const dayIndex = date.getDay()
      return habit.weekDays.includes(dayIndex)
    }
    return true // times_per_week — all days applicable
  }

  function isFutureDate(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d > today
  }

  return (
    <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
      {/* Habit name — sticky left */}
      <td className="sticky left-0 z-10 bg-card px-3 py-2">
        <button
          type="button"
          onClick={() => onEdit(habit)}
          className="flex items-center gap-2 text-left hover:text-primary transition-colors"
        >
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: habit.color || '#3b82f6' }}
          />
          <span className="text-sm font-medium text-foreground truncate max-w-30">
            {habit.name}
          </span>
          {habit.category && (() => {
            const pillarId = CATEGORY_TO_PILLAR[habit.category] || habit.category
            const pillar = LIFE_PILLARS.find(p => p.id === pillarId)
            return (
              <Badge variant="outline" className="text-[8px] px-1 py-0 hidden sm:inline-flex gap-1">
                {pillar && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: pillar.color }}
                  />
                )}
                {t(pillarI18nKey(pillarId) as any)}
              </Badge>
            )
          })()}
        </button>
      </td>

      {/* Day cells */}
      {dates.map((d) => {
        const log = getLogForDate(d.key)
        const completed = log ? log.completedCount >= habit.targetFrequency : false
        const partial = log ? log.completedCount > 0 && log.completedCount < habit.targetFrequency : false
        const applicable = isDayApplicable(d.date)
        const future = isFutureDate(d.date)
        const disabled = future || !applicable

        return (
          <td key={d.key} className={`px-1 py-2 text-center transition-colors ${d.isToday ? 'bg-primary/5' : ''} ${d.isToday ? 'border-r-2 border-primary/40' : ''}`}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(habit, d.key)}
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                disabled
                  ? future
                    ? 'cursor-default opacity-40 border-2 border-muted-foreground/20'
                    : 'cursor-default opacity-30'
                  : completed
                    ? 'bg-success text-white scale-100'
                    : partial
                      ? 'border-2 bg-success/20'
                      : 'border-2 border-muted-foreground/30 hover:border-primary hover:scale-110'
              }`}
              style={
                !disabled && !completed
                  ? { borderColor: habit.color || '#3b82f6' }
                  : completed
                    ? { backgroundColor: habit.color || '#3b82f6' }
                    : undefined
              }
            >
              {completed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {partial && habit.targetFrequency > 1 && (
                <span className="text-[8px] font-bold">
                  {log!.completedCount}
                </span>
              )}
            </button>
          </td>
        )
      })}

      {/* Streak */}
      <td className="px-3 py-2 text-center">
        <span
          className={`text-sm font-bold ${
            streak >= 10 ? 'text-success' : streak >= 5 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {streak > 0 ? streak : '-'}
        </span>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Compute current streak
// ---------------------------------------------------------------------------
function computeStreak(habit: Habit, logs: { date: string; completedCount: number }[]): number {
  const logMap = new Map<string, number>()
  for (const log of logs) {
    logMap.set(log.date.split('T')[0]!, log.completedCount)
  }

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = subDays(today, i)
    const key = format(d, 'yyyy-MM-dd')

    // Skip non-applicable days for weekly habits
    if (habit.frequencyType === 'week_days' && !habit.weekDays.includes(d.getDay())) {
      continue
    }

    const count = logMap.get(key) ?? 0
    if (count >= habit.targetFrequency) {
      streak++
    } else if (i > 0) {
      // Allow today to be incomplete
      break
    }
  }

  return streak
}
