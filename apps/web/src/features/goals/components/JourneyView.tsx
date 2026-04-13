import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { useTranslation } from 'react-i18next'
import type { QuarterlyGoal } from '@repo/shared/types'

const CURRENT_QUARTER = Math.ceil((new Date().getMonth() + 1) / 3)
const CURRENT_YEAR = new Date().getFullYear()

function useQuarterLabels(): Record<number, string> {
  const { t } = useTranslation('goals')
  return {
    1: t('quarterLabel1'),
    2: t('quarterLabel2'),
    3: t('quarterLabel3'),
    4: t('quarterLabel4'),
  }
}

export function JourneyView() {
  const { t } = useTranslation('goals')
  const QUARTER_LABELS = useQuarterLabels()
  const goalsQuery = useQuery(goalsQueries.quarterlyGoals({ year: CURRENT_YEAR }))
  const goals = (goalsQuery.data?.data ?? []) as QuarterlyGoal[]

  if (goalsQuery.isLoading) return <SkeletonList lines={2} />

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t('journeyTitle')}</h3>
        <p className="text-xs text-muted-foreground">{t('journeySubtitle')} {CURRENT_YEAR}</p>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-2 min-w-200">
          {[1, 2, 3, 4].map((quarter) => {
            const qGoals = goals.filter((g) => g.quarter === quarter)
            const isCurrent = quarter === CURRENT_QUARTER
            const avgProgress = qGoals.length > 0
              ? Math.round(qGoals.reduce((s, g) => s + g.progress, 0) / qGoals.length)
              : 0

            return (
              <div
                key={quarter}
                className={`flex-1 min-w-45 rounded-xl border p-4 ${
                  isCurrent ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                {/* Quarter header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Badge variant={isCurrent ? 'default' : 'outline'} className="text-xs">
                      Q{quarter}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {QUARTER_LABELS[quarter]}
                    </p>
                  </div>
                  {qGoals.length > 0 && (
                    <span className="text-lg font-bold text-foreground">{avgProgress}%</span>
                  )}
                </div>

                {/* Progress bar */}
                {qGoals.length > 0 && (
                  <Progress value={avgProgress} className="h-1.5 mb-3" />
                )}

                {/* Goal cards */}
                {qGoals.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    {t('noGoals')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {qGoals.map((goal) => (
                      <Card key={goal.id} className="bg-card/50">
                        <CardContent className="p-2.5">
                          <p className="text-xs font-medium text-foreground line-clamp-2">
                            {goal.title}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <Progress value={goal.progress} className="flex-1 h-1 mr-2" />
                            <span className="text-[10px] text-muted-foreground">{goal.progress}%</span>
                          </div>
                          {goal.objectives && goal.objectives.length > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-1">
                              {goal.objectives.length} {t('keyResults')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Quarter connector line */}
                {quarter < 4 && (
                  <div className="hidden" /> // Visual connector handled by flex gap
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
