import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
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
import { useDeleteTask } from '../../queries'
import {
  TitleField,
  DescriptionField,
  PriorityField,
  DurationField,
  DateTimeRangeField,
  ChannelField,
  WeeklyGoalField,
  TagsField,
} from '../form'

interface Props {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultStart?: string
  defaultEnd?: string
}

/**
 * Task config dialog optimized for calendar context.
 * Mirrors EventEditDialog ergonomics: date + start/end pickers,
 * inline channel + priority + goal. No AI, repeat, or AI-estimate.
 */
export function TaskCalendarDialog({ open, onClose, task, defaultStart, defaultEnd }: Props) {
  const { t } = useTranslation('tasks')
  const deleteTask = useDeleteTask()

  const tf = useTaskForm({
    open,
    task,
    defaultStart,
    defaultEnd,
    onSaved: onClose,
  })

  async function handleDelete() {
    if (!task) return
    if (!window.confirm(t('confirmDelete', { defaultValue: 'Delete this task?' }))) return
    try {
      await deleteTask.mutateAsync(task.id)
      toast.success(t('taskDeleted'))
      onClose()
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={tf.submit}>
          <DialogHeader>
            <DialogTitle>{tf.isEdit ? t('editTask') : t('createTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <TitleField form={tf.form} />

            <DateTimeRangeField form={tf.form} />

            <div className="grid grid-cols-2 gap-3">
              <PriorityField form={tf.form} />
              <DurationField form={tf.form} onUserEdit={tf.markDurationTouched} />
            </div>

            <DescriptionField form={tf.form} rows={3} />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <WeeklyGoalField form={tf.form} />
              </div>
              <ChannelField form={tf.form} />
            </div>

            <TagsField form={tf.form} addTag={tf.addTag} removeTag={tf.removeTag} />
          </div>

          <DialogFooter className="sm:justify-between">
            {tf.isEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="text-destructive gap-1"
              >
                <Trash2 size={14} />
                {t('delete', { ns: 'common', defaultValue: 'Delete' })}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={tf.isPending}>
                {tf.isEdit ? t('saveChanges') : t('createTask')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
