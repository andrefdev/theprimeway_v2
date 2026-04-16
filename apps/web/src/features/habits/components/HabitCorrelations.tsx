import { useTranslation } from 'react-i18next'
import { useHabitCorrelations } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { SkeletonCard } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { TrendingUp } from 'lucide-react'

const WEAK_STYLE = {
  className: 'bg-muted text-muted-foreground',
  key: 'correlationWeak',
} as const

const STRENGTH_STYLES: Record<string, { className: string; key: string }> = {
  strong: {
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    key: 'correlationStrong',
  },
  moderate: {
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    key: 'correlationModerate',
  },
  weak: WEAK_STYLE,
}

export function HabitCorrelations() {
  const { t } = useTranslation('habits')
  const { data, isLoading } = useHabitCorrelations()

  if (isLoading) return <SkeletonCard />

  const correlations = data?.correlations ?? []

  if (correlations.length === 0) {
    return (
      <EmptyState
        title={t('correlations')}
        description={t('noCorrelations')}
        icon={<TrendingUp size={28} />}
      />
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-primary" />
          <p className="text-xs font-medium text-muted-foreground">{t('correlations')}</p>
        </div>

        <div className="space-y-3">
          {correlations.map((corr, idx) => {
            const style = STRENGTH_STYLES[corr.strength] ?? WEAK_STYLE

            return (
              <div
                key={idx}
                className="rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-foreground">{corr.pattern}</p>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-[10px] py-0.5 border-0 ${style.className}`}
                  >
                    {t(style.key)}
                  </Badge>
                </div>

                {corr.habitNames.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {corr.habitNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0.5">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}

                {corr.insight && (
                  <p className="text-xs text-muted-foreground">{corr.insight}</p>
                )}
              </div>
            )
          })}
        </div>

        {data?.summary && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
            {data.summary}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
