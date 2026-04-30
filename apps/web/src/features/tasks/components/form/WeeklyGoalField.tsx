import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import { goalsQueries } from '@/features/goals/queries'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  showLabel?: boolean
}

export function WeeklyGoalField({ form, showLabel = true }: Props) {
  const { t } = useTranslation('tasks')
  const { data: goals = [] } = useQuery({ ...goalsQueries.weeklyGoals() })

  return (
    <div className="space-y-1.5">
      {showLabel && <Label>{t('weeklyGoal')}</Label>}
      <Select
        value={form.watch('weeklyGoalId') ?? 'none'}
        onValueChange={(v) => form.setValue('weeklyGoalId', v !== 'none' ? v : undefined)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('selectWeeklyGoal')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('none')}</SelectItem>
          {Array.isArray(goals) &&
            (goals as any[]).map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}
