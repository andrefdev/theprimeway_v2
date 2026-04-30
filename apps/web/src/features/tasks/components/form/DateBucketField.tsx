import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import type { TaskBucket } from '@repo/shared/types'
import { Label } from '@/shared/components/ui/label'
import { DateBucketPicker } from '../DateBucketPicker'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  showLabel?: boolean
  className?: string
}

export function DateBucketField({ form, showLabel = true, className = 'w-full' }: Props) {
  const { t } = useTranslation('tasks')
  return (
    <div className="space-y-1.5 flex-1">
      {showLabel && <Label>{t('scheduledDate', { defaultValue: 'When' })}</Label>}
      <DateBucketPicker
        className={className}
        value={{
          scheduledDate: form.watch('scheduledDate') ?? null,
          scheduledBucket:
            (form.watch('scheduledBucket') as TaskBucket | null | undefined) ?? null,
        }}
        onChange={(next) => {
          form.setValue('scheduledDate', next.scheduledDate ?? undefined)
          form.setValue('scheduledBucket', next.scheduledBucket ?? null)
        }}
      />
    </div>
  )
}
