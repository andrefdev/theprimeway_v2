import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  rows?: number
  id?: string
}

export function DescriptionField({ form, rows = 2, id = 'task-description' }: Props) {
  const { t } = useTranslation('tasks')
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{t('descriptionLabel')}</Label>
      <Textarea
        id={id}
        {...form.register('description')}
        placeholder={t('descriptionPlaceholder')}
        rows={rows}
      />
    </div>
  )
}
