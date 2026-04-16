import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { habitsQueries, useCreateHabit } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { SkeletonCard } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Lightbulb, Plus, Target } from 'lucide-react'
import { toast } from 'sonner'

export function HabitAiSuggestions() {
  const { t } = useTranslation('habits')
  const { data, isLoading } = useQuery(habitsQueries.aiSuggestions())
  const createHabit = useCreateHabit()

  async function handleAdd(suggestion: {
    name: string
    description: string
    frequency: string
    targetFrequency: number
    goalId: string
  }) {
    try {
      await createHabit.mutateAsync({
        name: suggestion.name,
        description: suggestion.description || undefined,
        frequencyType: (suggestion.frequency as 'daily' | 'week_days' | 'times_per_week') || 'daily',
        targetFrequency: suggestion.targetFrequency || 1,
        goalId: suggestion.goalId || undefined,
      })
      toast.success(t('habitCreated'))
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  if (isLoading) return <SkeletonCard />

  const suggestions = data?.suggestions ?? []

  if (suggestions.length === 0) {
    return (
      <EmptyState
        title={t('aiHabitSuggestions')}
        description={t('aiHabitSuggestionsDesc')}
        icon={<Lightbulb size={28} />}
      />
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-primary" />
          <p className="text-xs font-medium text-muted-foreground">{t('aiHabitSuggestions')}</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{t('aiHabitSuggestionsDesc')}</p>

        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{suggestion.name}</p>
                {suggestion.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {suggestion.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] py-0.5">
                    {suggestion.frequency || 'daily'}
                  </Badge>
                  {suggestion.goalTitle && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Target size={10} />
                      {suggestion.goalTitle}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-7"
                disabled={createHabit.isPending}
                onClick={() => handleAdd(suggestion)}
              >
                <Plus size={12} className="mr-1" />
                {t('addSuggestedHabit')}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
