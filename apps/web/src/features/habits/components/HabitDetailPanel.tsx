import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Clock, Target, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { habitsQueries, useLinkHabitToGoal } from '../queries'
import { HabitAIInsights } from './habitAiInsights'
import type { Habit } from '@repo/shared/types'

interface HabitDetailPanelProps {
  habit: Habit
  onClose: () => void
}

export function HabitDetailPanel({ habit, onClose }: HabitDetailPanelProps) {
  const { t } = useTranslation(['habits', 'common'])
  const linkHabitToGoal = useLinkHabitToGoal()

  const optimalTimeQuery = useQuery(habitsQueries.optimalReminderTime(habit.id))
  const goalSuggestionsQuery = useQuery(habitsQueries.goalSuggestions(habit.id))

  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null)

  useEffect(() => {
    if (habit) {
      setLinkedGoalId((habit as any).goalId ?? null)
    }
  }, [habit])

  async function handleLinkGoal(goalId: string | null) {
    try {
      await linkHabitToGoal.mutateAsync({ habitId: habit.id, goalId })
      setLinkedGoalId(goalId)
      toast.success(goalId ? t('goalLinked', { ns: 'habits' }) : t('goalUnlinked', { ns: 'habits' }))
    } catch {
      toast.error(t('failedToLinkGoal', { ns: 'habits' }))
    }
  }

  return (
    <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 sticky top-0 bg-background z-10 pb-2 -mx-4 px-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">{habit.name}</h2>
          {habit.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{habit.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {habit.category && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline">{habit.category}</Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Frequency</span>
            <span className="font-medium">
              {habit.frequencyType === 'daily' && t('displayDaily', { ns: 'habits' })}
              {habit.frequencyType === 'week_days' && `${habit.weekDays?.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`}
              {habit.frequencyType === 'times_per_week' && `${habit.targetFrequency}x/week`}
            </span>
          </div>

          {habit.color && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Color</span>
              <div
                className="w-5 h-5 rounded-full border border-border"
                style={{ backgroundColor: habit.color }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <HabitAIInsights habitId={habit.id} />

      {/* Optimal Reminder Time */}
      {optimalTimeQuery.isLoading ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suggested Reminder Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ) : optimalTimeQuery.data ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <CardTitle className="text-sm">Suggested Reminder Time</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Based on your habit patterns ({Math.round(optimalTimeQuery.data.confidence * 100)}% confidence)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{optimalTimeQuery.data.suggestedTime}</p>
              <p className="text-xs text-muted-foreground mt-1">{optimalTimeQuery.data.reason}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => toast.info('Reminder scheduling coming soon')}
            >
              {t('applyReminder', { ns: 'habits' })}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Goal Linking */}
      {goalSuggestionsQuery.isLoading ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Linked Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ) : goalSuggestionsQuery.data ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <CardTitle className="text-sm">{t('linkToGoal', { ns: 'common' })}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current linked goal */}
            {linkedGoalId && goalSuggestionsQuery.data.linkedGoal ? (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {goalSuggestionsQuery.data.linkedGoal.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Currently linked</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLinkGoal(null)}
                    className="text-xs h-7"
                  >
                    {t('unlink', { ns: 'habits' })}
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Suggested goals */}
            {(goalSuggestionsQuery.data.suggestions.weeklyGoals.length > 0 ||
              goalSuggestionsQuery.data.suggestions.quarterlyGoals.length > 0 ||
              goalSuggestionsQuery.data.suggestions.annualGoals.length > 0) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('suggestedGoals', { ns: 'habits' })}
                </p>

                {/* Weekly goals */}
                {goalSuggestionsQuery.data.suggestions.weeklyGoals.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Weekly</p>
                    {goalSuggestionsQuery.data.suggestions.weeklyGoals.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => handleLinkGoal(goal.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <span>{goal.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quarterly goals */}
                {goalSuggestionsQuery.data.suggestions.quarterlyGoals.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Quarterly</p>
                    {goalSuggestionsQuery.data.suggestions.quarterlyGoals.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => handleLinkGoal(goal.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <span>{goal.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Annual goals */}
                {goalSuggestionsQuery.data.suggestions.annualGoals.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Annual</p>
                    {goalSuggestionsQuery.data.suggestions.annualGoals.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => handleLinkGoal(goal.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <span>{goal.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {goalSuggestionsQuery.data.suggestions.weeklyGoals.length === 0 &&
              goalSuggestionsQuery.data.suggestions.quarterlyGoals.length === 0 &&
              goalSuggestionsQuery.data.suggestions.annualGoals.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  {t('noGoalSuggestions', { ns: 'habits' })}
                </p>
              )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
