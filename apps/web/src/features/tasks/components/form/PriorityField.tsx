import { useTranslation } from 'react-i18next'
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

const OPTIONS = [
  { value: 'low', color: 'text-blue-500' },
  { value: 'medium', color: 'text-yellow-500' },
  { value: 'high', color: 'text-red-500' },
] as const

interface Props {
  form: UseFormReturn<CreateTaskInput>
  showLabel?: boolean
}

export function PriorityField({ form, showLabel = true }: Props) {
  const { t } = useTranslation('tasks')
  return (
    <div className="space-y-1.5">
      {showLabel && <Label>{t('priority')}</Label>}
      <Select
        value={form.watch('priority') ?? 'medium'}
        onValueChange={(v) => form.setValue('priority', v as 'low' | 'medium' | 'high')}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className={opt.color}>{t(`priority_${opt.value}`)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
