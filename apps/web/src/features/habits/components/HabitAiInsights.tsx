import { useTranslation } from 'react-i18next'
import { Zap, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useHabitAnalysis } from '../queries'

interface HabitAIInsightsProps {
  habitId: string
}

export function HabitAIInsights({ habitId }: HabitAIInsightsProps) {
  const { t } = useTranslation('habits')
  const { data, isLoading, error } = useHabitAnalysis(habitId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('aiInsights', 'AI Insights')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('aiInsights', 'AI Insights')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{t('failedToLoadInsights', 'Failed to load insights')}</p>
        </CardContent>
      </Card>
    )
  }

  const consistencyColor = {
    excellent: 'bg-green-500/10 text-green-700 dark:text-green-400',
    good: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    fair: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    poor: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('aiInsights', 'AI Insights')}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Based on your last 90 days of tracking
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Completion Rate</p>
            <p className="text-lg font-semibold">{data.metrics.completionRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="text-lg font-semibold">{data.metrics.currentStreak}d</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Best Streak</p>
            <p className="text-lg font-semibold">{data.metrics.longestStreak}d</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Completions</p>
            <p className="text-lg font-semibold">{data.metrics.totalCompletions}</p>
          </div>
        </div>

        {/* Consistency Badge */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Consistency:</p>
          <Badge className={`text-xs capitalize ${consistencyColor[data.patterns.consistencyLevel]}`}>
            {data.patterns.consistencyLevel}
          </Badge>
        </div>

        {/* Best Days */}
        {data.patterns.bestDaysOfWeek.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Best Days</p>
            <div className="flex gap-1">
              {data.patterns.bestDaysOfWeek.map((day) => (
                <Badge key={day} variant="outline" className="text-xs">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {data.insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <p className="text-xs font-semibold">Suggestions</p>
            </div>
            <div className="space-y-1">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
