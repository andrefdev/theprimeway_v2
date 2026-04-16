import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
}

export function TaskStatsPanel() {
  const { t } = useTranslation('tasks')
  const { data, isLoading } = useQuery(tasksQueries.serverStats(30))

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded bg-muted" />
  }

  if (!data) return null

  const { period, counts, avgCompletedPerDay, byPriority, estimateAdherence, completedPerDay } = data as {
    period: { days: number; completedTotal: number }
    counts: { open: number; completed: number; archived: number; total: number }
    avgCompletedPerDay: number
    byPriority: Record<string, number>
    estimateAdherence: number | null
    completedPerDay: Array<{ date: string; count: number }>
  }

  const maxDaily = Math.max(...completedPerDay.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('open', { ns: 'common' })} value={counts.open} />
        <StatCard label={t('completed', { ns: 'common' })} value={counts.completed} />
        <StatCard label={t('avgPerDay', { defaultValue: 'Avg/Day' })} value={avgCompletedPerDay} />
        <StatCard
          label={t('estimateAccuracy', { defaultValue: 'Est. Accuracy' })}
          value={estimateAdherence != null ? `${Math.round(estimateAdherence * 100)}%` : '—'}
        />
      </div>

      {/* Priority breakdown */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            {t('byPriority', { defaultValue: 'By Priority' })} ({period.days}d)
          </h4>
          <div className="space-y-1.5">
            {Object.entries(byPriority).map(([priority, count]) => {
              const pct = period.completedTotal > 0 ? Math.round((count / period.completedTotal) * 100) : 0
              return (
                <div key={priority} className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${PRIORITY_COLORS[priority] ?? 'bg-muted-foreground'}`} />
                  <span className="w-16 text-xs capitalize text-foreground">{priority}</span>
                  <Progress value={pct} className="flex-1 h-2" />
                  <span className="w-12 text-xs text-muted-foreground text-right">{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily completion mini-chart */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            {t('completedPerDay', { defaultValue: 'Daily Completions' })}
          </h4>
          <div className="flex items-end gap-px h-16">
            {completedPerDay.slice(-30).map((day) => (
              <div
                key={day.date}
                className="flex-1 bg-primary/70 rounded-t-sm min-w-[2px] transition-all hover:bg-primary"
                style={{ height: `${(day.count / maxDaily) * 100}%` }}
                title={`${day.date}: ${day.count}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
