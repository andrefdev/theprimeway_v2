import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { habitsQueries, useCreateHabit } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { SkeletonCard } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Layers, Plus, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function HabitStacking() {
  const { t } = useTranslation('habits')
  const { data, isLoading } = useQuery(habitsQueries.habitStacking())
  const createHabit = useCreateHabit()

  async function handleAdd(stack: { newHabit: string }) {
    try {
      await createHabit.mutateAsync({
        name: stack.newHabit,
        frequencyType: 'daily',
        targetFrequency: 1,
      })
      toast.success(t('habitCreated'))
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  if (isLoading) return <SkeletonCard />

  const stacks = data?.stacks ?? []

  if (stacks.length === 0) {
    return (
      <EmptyState
        title={t('habitStackingSuggestions')}
        description={t('noStackingSuggestions')}
        icon={<Layers size={28} />}
      />
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-primary" />
          <p className="text-xs font-medium text-muted-foreground">{t('habitStackingSuggestions')}</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{t('habitStackingDesc')}</p>

        <div className="space-y-3">
          {stacks.map((stack, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('afterAnchor', { anchor: stack.anchor })}
                  </span>
                  <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {stack.newHabit}
                  </span>
                </div>
                {stack.reason && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {stack.reason}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-7"
                disabled={createHabit.isPending}
                onClick={() => handleAdd(stack)}
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
