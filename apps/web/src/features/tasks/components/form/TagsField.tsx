import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  addTag: (tag: string) => void
  removeTag: (tag: string) => void
  showLabel?: boolean
}

export function TagsField({ form, addTag, removeTag, showLabel = true }: Props) {
  const { t } = useTranslation('tasks')
  const tags = form.watch('tags') ?? []

  return (
    <div className="space-y-1.5">
      {showLabel && <Label>{t('tags')}</Label>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => removeTag(tag)}
              className="ml-0.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              &times;
            </Button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder={t('addTagPlaceholder')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTag(e.currentTarget.value)
            e.currentTarget.value = ''
          }
        }}
      />
    </div>
  )
}
