import { useTranslation } from 'react-i18next'
import type { TaskBucket } from '@repo/shared/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { useTaskForm } from '../../hooks/use-task-form'
import { TitleField, DurationField, DateBucketField } from '../form'

interface Props {
  open: boolean
  onClose: () => void
  defaultDate?: string
  defaultBucket?: TaskBucket | null
  defaultStart?: string
  defaultEnd?: string
}

/**
 * Minimal task creator. Used for slot-click on calendar, dashboard quick-add,
 * and "+" buttons. Hints user that more options exist in the full dialog.
 */
export function TaskQuickDialog({
  open,
  onClose,
  defaultDate,
  defaultBucket,
  defaultStart,
  defaultEnd,
}: Props) {
  const { t } = useTranslation('tasks')

  const tf = useTaskForm({
    open,
    defaultDate,
    defaultStart,
    defaultEnd,
    defaultBucket: defaultBucket ?? (defaultDate ? 'TODAY' : null),
    onSaved: onClose,
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={tf.submit}>
          <DialogHeader>
            <DialogTitle>{t('createTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <TitleField form={tf.form} />

            <div className="grid grid-cols-2 gap-3">
              <DurationField form={tf.form} onUserEdit={tf.markDurationTouched} />
              <DateBucketField form={tf.form} />
            </div>

            <p className="text-xs text-muted-foreground">
              {t('quickHint', {
                defaultValue:
                  'More options (subtasks, exact time, repeat, channel, weekly goal) are available after creating the task.',
              })}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={tf.isPending || !tf.form.watch('title').trim()}>
              {tf.isPending ? t('common:loading', { defaultValue: 'Loading...' }) : t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
