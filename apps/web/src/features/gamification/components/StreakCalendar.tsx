import { useQuery } from '@tanstack/react-query'
import { gamificationQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { useTranslation } from 'react-i18next'

export function StreakCalendar() {
  const { t } = useTranslation('gamification')
  const streakQuery = useQuery(gamificationQueries.streak())
  const streakData = streakQuery.data?.data

  if (streakQuery.isLoading) return <SkeletonList lines={2} />
  if (!streakData) return null

  const heatmap = streakData.heatmap ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('streakTitle')}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{streakData.currentStreak} {t('currentStreak')}</span>
          <span>{t('best')}: {streakData.longestStreak}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-1">
            {heatmap.slice(-35).map((day) => {
              const intensity = day.goalMet
                ? 'bg-foreground'
                : day.totalXp > 0
                  ? 'bg-foreground/25'
                  : 'bg-muted'
              return (
                <div
                  key={day.date}
                  className={`h-3.5 w-3.5 rounded-sm ${intensity} transition-colors`}
                  title={`${day.date}: ${day.totalXp} XP${day.goalMet ? ' ✓' : ''}`}
                />
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2 text-[9px] text-muted-foreground">
            <span>{t('less')}</span>
            <div className="flex gap-0.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-muted" />
              <div className="h-2.5 w-2.5 rounded-sm bg-foreground/25" />
              <div className="h-2.5 w-2.5 rounded-sm bg-foreground" />
            </div>
            <span>{t('more')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
