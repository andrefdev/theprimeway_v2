import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { useTranslation } from 'react-i18next'

const URGENCY_COLORS = {
  high: 'destructive',
  medium: 'default',
  low: 'outline',
} as const

export function InactiveGoalsAlert() {
  const { t } = useTranslation('common')
  const { data, isLoading } = useQuery(goalsQueries.inactive())

  if (isLoading || !data || data.count === 0) return null

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-sm">&#9888;</span>
          <h4 className="text-sm font-semibold text-foreground">{t('inactiveGoals')}</h4>
          <Badge variant="outline" className="text-[10px]">{data.count}</Badge>
        </div>
        <div className="space-y-1.5">
          {data.inactive.slice(0, 5).map((goal) => (
            <div key={goal.goalId} className="flex items-center justify-between text-xs">
              <span className="text-foreground truncate">{goal.title}</span>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <Badge variant={URGENCY_COLORS[goal.urgency]} className="text-[10px]">
                  {goal.urgency}
                </Badge>
                <span className="text-muted-foreground">
                  {t('daysSinceActivity', { count: goal.daysSinceActivity })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
