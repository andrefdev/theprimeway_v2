import { useQuery } from '@tanstack/react-query'
import { aiQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { useTranslation } from 'react-i18next'
import type { Briefing } from '@repo/shared/types'

export function BriefingCard() {
  const { t } = useTranslation('ai')
  const briefingQuery = useQuery(aiQueries.briefing())
  const briefing = briefingQuery.data?.data as Briefing | undefined

  if (briefingQuery.isLoading) return <SkeletonList lines={2} />
  if (!briefing) return null

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-950/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">&#x2728;</span>
          <h3 className="text-sm font-semibold text-foreground">{t('dailyBriefing')}</h3>
        </div>

        {briefing.summary && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{briefing.summary}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {t('tasksStatus', { done: briefing.tasksCompleted, total: briefing.tasksToday })}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {t('habitsStatus', { done: briefing.habitsCompleted, total: briefing.habitsToday })}
          </Badge>
          {briefing.upcomingEvents > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t('eventsCount', { count: briefing.upcomingEvents })}
            </Badge>
          )}
          {briefing.streak > 0 && (
            <Badge variant="outline" className="text-xs">
              {t('streakBadge', { count: briefing.streak })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
