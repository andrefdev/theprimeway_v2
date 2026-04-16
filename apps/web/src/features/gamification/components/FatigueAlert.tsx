import { useQuery } from '@tanstack/react-query'
import { gamificationQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

export function FatigueAlert() {
  const { t } = useTranslation('gamification')
  const { data, isLoading } = useQuery(gamificationQueries.fatigue())

  if (isLoading || !data?.data?.fatigueDetected) return null

  const { indicators, recommendations } = data.data as {
    fatigueDetected: boolean
    indicators: Array<{ type: string; severity: string; detail: string }>
    recommendations: string[]
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-sm">&#9888;</span>
          <h4 className="text-sm font-semibold text-foreground">{t('fatigueDetected')}</h4>
        </div>

        {indicators?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {indicators.map((ind, i) => (
              <Badge
                key={i}
                variant={ind.severity === 'warning' ? 'destructive' : 'outline'}
                className="text-[10px]"
              >
                {ind.type === 'easy_tasks_only' && t('easyTasksWarning')}
                {ind.type === 'xp_declining' && t('xpDeclining')}
                {ind.type === 'avoiding_hard_tasks' && t('easyTasksWarning')}
                {ind.type === 'habits_declining' && t('xpDeclining')}
                {!['easy_tasks_only', 'xp_declining', 'avoiding_hard_tasks', 'habits_declining'].includes(ind.type) && ind.detail}
              </Badge>
            ))}
          </div>
        )}

        {recommendations?.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {recommendations.slice(0, 3).map((rec, i) => (
              <li key={i}>&#8226; {rec}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
