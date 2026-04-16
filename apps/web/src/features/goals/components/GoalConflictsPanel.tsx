import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

const CONFLICT_LABELS: Record<string, string> = {
  time_conflict: 'timeConflict',
  resource_conflict: 'resourceConflict',
  priority_conflict: 'timeConflict',
  scope_overlap: 'resourceConflict',
}

const SEVERITY_COLORS = {
  high: 'destructive',
  medium: 'default',
  low: 'outline',
} as const

export function GoalConflictsPanel() {
  const { t } = useTranslation('common')
  const { data, isLoading } = useQuery(goalsQueries.conflicts())

  if (isLoading || !data) return null

  const { conflicts, overcommitted } = data as {
    conflicts: Array<{
      type: string
      severity: string
      goals: string[]
      description: string
      suggestion: string
    }>
    overcommitted: boolean
  }

  if (!conflicts?.length && !overcommitted) return null

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-sm">&#9888;</span>
          <h4 className="text-sm font-semibold text-foreground">{t('goalConflicts')}</h4>
        </div>

        {overcommitted && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{t('overcommitted')}</p>
        )}

        {conflicts?.length > 0 && (
          <div className="space-y-2">
            {conflicts.slice(0, 5).map((conflict, i) => (
              <div key={i} className="rounded border border-border/50 p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={SEVERITY_COLORS[conflict.severity as keyof typeof SEVERITY_COLORS] ?? 'outline'}
                    className="text-[10px]"
                  >
                    {t(CONFLICT_LABELS[conflict.type] ?? conflict.type)}
                  </Badge>
                  <span className="text-xs text-foreground">{conflict.description}</span>
                </div>
                {conflict.suggestion && (
                  <p className="text-[11px] text-muted-foreground italic">{conflict.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
