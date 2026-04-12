import { useQuery } from '@tanstack/react-query'
import { gamificationQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import type { DailyChallenge } from '@repo/shared/types'

export function DailyChallenges() {
  const { t, i18n } = useTranslation('gamification')
  const locale = i18n.language
  const today = format(new Date(), 'yyyy-MM-dd')
  const challengesQuery = useQuery(gamificationQueries.challenges(today))
  const challenges = (challengesQuery.data?.data ?? []) as DailyChallenge[]

  const completedCount = challenges.filter((c) => c.isCompleted).length

  if (challengesQuery.isLoading) return <SkeletonList lines={3} />

  if (challenges.length === 0) {
    return <EmptyState title={t('noChallenges')} description={t('noChallengesDescription')} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('dailyChallenges')}</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{challenges.length}
        </span>
      </div>

      <div className="space-y-2">
        {challenges.map((challenge) => {
          const title = locale === 'es' ? challenge.titleEs : challenge.titleEn
          const description = locale === 'es' ? challenge.descriptionEs : challenge.descriptionEn
          const progress = challenge.targetValue > 0
            ? Math.min((challenge.currentValue / challenge.targetValue) * 100, 100)
            : 0

          return (
            <Card key={challenge.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {challenge.isCompleted && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
                      <p className={`text-sm font-medium ${challenge.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {title}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    +{challenge.xpReward} XP
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{challenge.currentValue}/{challenge.targetValue}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
