import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Button } from '@/shared/components/ui/button'
import { TargetIcon } from '@/shared/components/Icons'
import { Combobox, type ComboboxOption } from '@/shared/components/ui/combobox'
import { goalsQueries } from '@/features/goals/queries'
import { localIsoWeekStartYmd } from '@repo/shared/utils'
import { useUserTimezone } from '@/features/settings/hooks/use-user-timezone'

interface Props {
  value: string | undefined
  onChange: (id: string | undefined) => void
}

export function InlineWeeklyGoalPicker({ value, onChange }: Props) {
  const { t } = useTranslation('tasks')
  const tz = useUserTimezone()
  const weekStartDate = useMemo(() => localIsoWeekStartYmd(new Date(), tz), [tz])
  const { data: goals = [] } = useQuery({ ...goalsQueries.weeklyGoals({ weekStartDate }) })

  const options: ComboboxOption[] = useMemo(
    () =>
      Array.isArray(goals)
        ? (goals as any[]).map((g) => ({ value: g.id, label: g.title }))
        : [],
    [goals],
  )

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      searchPlaceholder={t('composer.searchGoal', { defaultValue: 'Search goal…' })}
      emptyMessage={t('common:noResults', { defaultValue: 'No results' })}
      clearable
      clearLabel={t('common:clear', { defaultValue: 'Clear' })}
      contentClassName="w-64"
      trigger={(selected) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <TargetIcon size={14} />
          {selected?.label?.slice(0, 18) ?? t('composer.goal', { defaultValue: 'goal' })}
        </Button>
      )}
    />
  )
}
