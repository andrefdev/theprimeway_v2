import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { ChevronRightIcon } from '@/shared/components/Icons'
import { tasksQueries } from '../../queries'

interface Props {
  taskId: string
  form: UseFormReturn<CreateTaskInput>
  addTag: (tag: string) => void
}

export function AIInsightsPanel({ taskId, form, addTag }: Props) {
  const { t } = useTranslation('tasks')
  const [open, setOpen] = useState(false)

  const {
    data: insight,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...tasksQueries.insight(taskId),
    enabled: open && !!taskId,
    retry: false,
  })

  return (
    <div className="space-y-1.5 border-t pt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="w-full justify-start gap-2 text-sm font-medium text-foreground hover:text-primary"
      >
        <ChevronRightIcon
          size={16}
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {t('aiInsights')}
      </Button>
      {open && (
        <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-border/30 text-sm">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">
              {t('common:loading', { defaultValue: 'Loading...' })}
            </p>
          ) : isError ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-destructive">{t('insightsError')}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs h-6 px-2"
                onClick={() => refetch()}
              >
                {t('retry')}
              </Button>
            </div>
          ) : insight ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('context')}</p>
                <p className="text-xs">{insight.contextBrief}</p>
              </div>
              {insight.suggestedSubtasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t('suggestedSubtasks')}
                  </p>
                  <ul className="space-y-1">
                    {insight.suggestedSubtasks.map((subtask, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <Checkbox
                          className="mt-0.5"
                          onCheckedChange={(checked) => {
                            if (checked) addTag(subtask)
                          }}
                        />
                        <span>{subtask}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insight.tips.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t('tips')}</p>
                  <ul className="space-y-1">
                    {insight.tips.map((tip, i) => (
                      <li key={i} className="text-xs">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insight.suggestedGoalTitle && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t('suggestedGoal')}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs flex-1">{insight.suggestedGoalTitle}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2"
                      onClick={() => form.setValue('weeklyGoalId', insight.suggestedGoalId)}
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('noInsightsAvailable')}</p>
          )}
        </div>
      )}
    </div>
  )
}
