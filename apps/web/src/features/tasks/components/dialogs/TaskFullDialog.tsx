import { useTranslation } from 'react-i18next'
import type { Task } from '@repo/shared/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { useTaskForm } from '../../hooks/use-task-form'
import {
  TitleField,
  DescriptionField,
  PriorityField,
  DurationField,
  DateBucketField,
  ChannelField,
  WeeklyGoalField,
  TagsField,
  RepeatField,
  ScheduleSuggestionPanel,
} from '../form'

interface Props {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: string
  defaultStart?: string
  defaultEnd?: string
}

/**
 * Full power-user task dialog used in /tasks/* routes.
 * Composes every available form primitive.
 */
export function TaskFullDialog({ open, onClose, task, defaultDate, defaultStart, defaultEnd }: Props) {
  const { t } = useTranslation('tasks')

  const tf = useTaskForm({
    open,
    task,
    defaultDate,
    defaultStart,
    defaultEnd,
    autoEstimate: true,
    enableRepeat: true,
    onSaved: onClose,
  })

  const scheduledDate = tf.form.watch('scheduledDate')
  const estimatedDuration = tf.form.watch('estimatedDuration')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={tf.submit}>
          <DialogHeader>
            <DialogTitle>{tf.isEdit ? t('editTask') : t('createTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <TitleField form={tf.form} />
            <DescriptionField form={tf.form} />

            <div className="grid grid-cols-2 gap-4">
              <PriorityField form={tf.form} />
              <DurationField
                form={tf.form}
                estimating={tf.estimating}
                onUserEdit={tf.markDurationTouched}
              />
            </div>

            <div className="flex items-end gap-2">
              <DateBucketField form={tf.form} />
              <ChannelField form={tf.form} />
            </div>

            <ScheduleSuggestionPanel
              suggestion={tf.scheduleSuggestion}
              loading={tf.scheduleSuggestionLoading}
              visible={!!scheduledDate && !!estimatedDuration}
            />

            <TagsField form={tf.form} addTag={tf.addTag} removeTag={tf.removeTag} />

            {!tf.isEdit && <RepeatField value={tf.repeat} onChange={tf.setRepeat} />}

            <WeeklyGoalField form={tf.form} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={tf.isPending}>
              {tf.isEdit
                ? t('saveChanges')
                : tf.repeat.enabled
                  ? t('createSeries', { defaultValue: 'Create series' })
                  : t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
