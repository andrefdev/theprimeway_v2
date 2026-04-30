import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  autoFocus?: boolean
  showLabel?: boolean
  id?: string
}

export function TitleField({ form, autoFocus = true, showLabel = true, id = 'task-title' }: Props) {
  const { t } = useTranslation('tasks')
  const error = form.formState.errors.title

  return (
    <div className="space-y-1.5">
      {showLabel && <Label htmlFor={id}>{t('titleLabel')}</Label>}
      <Input
        id={id}
        {...form.register('title')}
        placeholder={t('titlePlaceholder')}
        autoFocus={autoFocus}
      />
      {error && <p className="text-xs text-destructive">{t('titleRequired')}</p>}
    </div>
  )
}
