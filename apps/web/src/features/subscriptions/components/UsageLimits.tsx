import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { featureQueries } from '@/features/feature-flags/queries'
import { FEATURES } from '@repo/shared/constants'

const ROW_LABELS: Record<string, { label: string; defaultValue: string }> = {
  [FEATURES.HABITS_LIMIT]: { label: 'limits.habits', defaultValue: 'Habits' },
  [FEATURES.TASKS_LIMIT]: { label: 'limits.tasks', defaultValue: 'Tasks' },
  [FEATURES.GOALS_LIMIT]: { label: 'limits.goals', defaultValue: 'Active goals' },
  [FEATURES.BRAIN_ENTRIES_LIMIT]: { label: 'limits.brain', defaultValue: 'Brain entries' },
  [FEATURES.POMODORO_DAILY_LIMIT]: { label: 'limits.pomodoro', defaultValue: 'Pomodoro sessions today' },
}

const ROW_ORDER = [
  FEATURES.TASKS_LIMIT,
  FEATURES.HABITS_LIMIT,
  FEATURES.GOALS_LIMIT,
  FEATURES.POMODORO_DAILY_LIMIT,
  FEATURES.BRAIN_ENTRIES_LIMIT,
]

export function UsageLimits() {
  const { t } = useTranslation('settings')
  const { data, isLoading } = useQuery(featureQueries.usage())

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('limits.title', { defaultValue: 'Plan usage' })}</CardTitle>
        <CardDescription>
          {t('limits.description', {
            defaultValue: 'How much of your plan you have used. Hit a cap and the related action will be blocked until you upgrade.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !data ? (
          <div className="space-y-3">
            {ROW_ORDER.map((k) => (
              <Skeleton key={k} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          ROW_ORDER.map((key) => {
            const row = data.data[key]
            if (!row) return null
            const meta = ROW_LABELS[key]!
            const unlimited = row.limit === -1
            const pct = unlimited ? 0 : Math.min(100, Math.round((row.current / Math.max(row.limit, 1)) * 100))
            const reached = !unlimited && row.current >= row.limit
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {t(meta.label, { defaultValue: meta.defaultValue })}
                  </span>
                  <span className={reached ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {unlimited
                      ? t('limits.unlimited', { defaultValue: 'Unlimited' })
                      : `${row.current} / ${row.limit}`}
                  </span>
                </div>
                {!unlimited && <Progress value={pct} className="h-1.5" />}
              </div>
            )
          })
        )}
        <div className="pt-2">
          <Link to="/subscription">
            <Button variant="outline" size="sm">
              {t('limits.manage', { defaultValue: 'Manage plan' })}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
