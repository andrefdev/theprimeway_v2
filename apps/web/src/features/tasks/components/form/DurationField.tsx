import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Label } from '@/shared/components/ui/label'
import { DurationCombobox } from '../DurationCombobox'

const DEFAULT_PRESETS = [15, 30, 45, 60, 90, 120]

interface Props {
  form: UseFormReturn<CreateTaskInput>
  presets?: number[]
  showLabel?: boolean
  estimating?: boolean
  onUserEdit?: () => void
}

export function DurationField({
  form,
  presets = DEFAULT_PRESETS,
  showLabel = true,
  estimating,
  onUserEdit,
}: Props) {
  const { t } = useTranslation('tasks')
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <Label>{t('estimatedDuration')}</Label>
          {estimating && (
            <span className="text-[10px] text-muted-foreground">
              {t('common:loading', { defaultValue: 'Loading...' })}
            </span>
          )}
        </div>
      )}
      <DurationCombobox
        value={form.watch('estimatedDuration')}
        onChange={(v) => {
          onUserEdit?.()
          form.setValue('estimatedDuration', v)
        }}
        presets={presets}
        placeholder={t('selectDuration')}
      />
    </div>
  )
}
