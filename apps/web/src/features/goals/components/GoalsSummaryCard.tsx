import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { useTranslation } from 'react-i18next'

const LEVEL_KEYS: Record<string, string> = {
  vision: 'levelVision',
  threeYear: 'levelThreeYear',
  annual: 'levelAnnual',
  quarterly: 'levelQuarterly',
  weekly: 'levelWeekly',
}

const LEVEL_DEFAULTS: Record<string, string> = {
  vision: 'Vision',
  threeYear: '3-Year',
  annual: 'Annual',
  quarterly: 'Quarterly',
  weekly: 'Weekly',
}

export function GoalsSummaryCard() {
  const { t } = useTranslation('common')
  const { data, isLoading } = useQuery(goalsQueries.dashboardSummary())

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { levels, upcomingDeadlines, recentlyCompleted } = data
  const totalGoals = Object.values(levels).reduce((sum, l) => sum + l.total, 0)

  if (totalGoals === 0) return null

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t('goalsDashboard')}</h3>
          <span className="text-xs text-muted-foreground">
            {t('totalGoals')}: {totalGoals}
          </span>
        </div>

        {/* Per-level progress */}
        <div className="space-y-2">
          {Object.entries(levels).map(([key, level]) => {
            if (level.total === 0) return null
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground truncate">
                  {t(LEVEL_KEYS[key] ?? key, { defaultValue: LEVEL_DEFAULTS[key] ?? key })}
                </span>
                <Progress value={level.avgProgress} className="flex-1 h-2" />
                <span className="w-8 text-xs text-muted-foreground text-right">
                  {level.avgProgress}%
                </span>
                <div className="flex gap-1">
                  {level.health.green > 0 && (
                    <span className="size-2 rounded-full bg-emerald-500" title={t('healthGreen')} />
                  )}
                  {level.health.yellow > 0 && (
                    <span className="size-2 rounded-full bg-amber-500" title={t('healthYellow')} />
                  )}
                  {level.health.red > 0 && (
                    <span className="size-2 rounded-full bg-red-500" title={t('healthRed')} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('upcomingDeadlines')}</h4>
            <div className="space-y-1">
              {upcomingDeadlines.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate">{d.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className="text-[10px]">{d.level}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(d.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently completed */}
        {recentlyCompleted.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('recentlyCompleted')}</h4>
            <div className="space-y-1">
              {recentlyCompleted.slice(0, 3).map((g) => (
                <div key={g.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate">{g.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{g.level}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
