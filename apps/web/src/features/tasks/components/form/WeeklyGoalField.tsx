import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Label } from '@/shared/components/ui/label'
import { Combobox, type ComboboxOption } from '@/shared/components/ui/combobox'
import { goalsQueries } from '@/features/goals/queries'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  showLabel?: boolean
}

export function WeeklyGoalField({ form, showLabel = true }: Props) {
  const { t } = useTranslation('tasks')
  const { data: goals = [] } = useQuery({ ...goalsQueries.weeklyGoals() })

  const options: ComboboxOption[] = useMemo(
    () =>
      Array.isArray(goals)
        ? (goals as any[]).map((g) => ({ value: g.id, label: g.title }))
        : [],
    [goals],
  )

  const value = form.watch('weeklyGoalId')

  return (
    <div className="space-y-1.5">
      {showLabel && <Label>{t('weeklyGoal')}</Label>}
      <Combobox
        options={options}
        value={value}
        onChange={(v) => form.setValue('weeklyGoalId', v)}
        placeholder={t('selectWeeklyGoal')}
        searchPlaceholder={t('composer.searchGoal', { defaultValue: 'Search goal…' })}
        emptyMessage={t('common:noResults', { defaultValue: 'No results' })}
        clearable
        clearLabel={t('none')}
      />
    </div>
  )
}
