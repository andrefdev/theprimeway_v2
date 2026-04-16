import { useQuery } from '@tanstack/react-query'
import { habitsQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { useTranslation } from 'react-i18next'

const URGENCY_STYLES = {
  gentle: { border: 'border-blue-500/50', bg: 'bg-blue-500/5', icon: '\u{1F4AC}' },
  urgent: { border: 'border-amber-500/50', bg: 'bg-amber-500/5', icon: '\u26A0' },
  critical: { border: 'border-red-500/50', bg: 'bg-red-500/5', icon: '\u{1F6A8}' },
  minimal: { border: 'border-purple-500/50', bg: 'bg-purple-500/5', icon: '\u{1F4A1}' },
} as const

const URGENCY_BADGE: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  gentle: 'outline',
  urgent: 'default',
  critical: 'destructive',
  minimal: 'secondary',
}

export function StreakProtectionAlert() {
  const { t } = useTranslation('habits')
  const { data, isLoading } = useQuery(habitsQueries.streakProtection())

  if (isLoading) return null

  // Filter out 'none' urgency — those are safe
  const atRisk = (data ?? []).filter((h) => h.urgency !== 'none')

  if (atRisk.length === 0) return null

  return (
    <div className="space-y-2">
      {atRisk.map((habit) => {
        const style = URGENCY_STYLES[habit.urgency as keyof typeof URGENCY_STYLES] ?? URGENCY_STYLES.gentle
        return (
          <Card key={habit.habitId} className={`${style.border} ${style.bg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <span className="text-sm">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{habit.habitName}</span>
                    <Badge variant={URGENCY_BADGE[habit.urgency] ?? 'outline'} className="text-[10px]">
                      {t(`${habit.urgency}Reminder`, { defaultValue: habit.urgency })}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {t('streakDays', { defaultValue: '{{count}}d streak', count: habit.currentStreak })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{habit.message}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {t('hoursLeft', { defaultValue: '{{hours}}h left', hours: Math.round(habit.hoursRemaining * 10) / 10 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
