import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { gamificationQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'

const SOURCE_LABELS: Record<string, string> = {
  task_complete: 'Tasks',
  habit_complete: 'Habits',
  pomodoro_complete: 'Pomodoro',
  streak_bonus: 'Streak',
  challenge_complete: 'Challenges',
  achievement: 'Achievements',
}

export function WeeklyXpBreakdown() {
  const { t } = useTranslation('gamification')
  const { data, isLoading } = useQuery(gamificationQueries.weeklyXp())

  if (isLoading || !data?.data) return null

  const { totalXp, breakdown } = data.data
  if (!breakdown?.length) return null

  const sorted = [...breakdown].sort((a, b) => b.xp - a.xp)
  const maxXp = sorted[0]?.xp ?? 1

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t('weeklyXpTitle')}</h3>
          <span className="text-xs font-medium text-primary">{totalXp} XP</span>
        </div>
        <div className="space-y-2">
          {sorted.map((item) => (
            <div key={item.source} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {SOURCE_LABELS[item.source] ?? item.source}
                </span>
                <span className="text-foreground font-medium">{item.xp} XP</span>
              </div>
              <Progress value={(item.xp / maxXp) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
