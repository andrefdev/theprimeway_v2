import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useCreateTask } from '../queries'
import { DurationCombobox } from './DurationCombobox'
import { DateBucketPicker, type DateBucketValue } from './DateBucketPicker'
import type { TaskBucket } from '@repo/shared/types'

interface QuickTaskDialogProps {
  open: boolean
  onClose: () => void
  defaultDate?: string
  defaultBucket?: TaskBucket | null
  defaultStart?: string
  defaultEnd?: string
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export function QuickTaskDialog({ open, onClose, defaultDate, defaultBucket, defaultStart, defaultEnd }: QuickTaskDialogProps) {
  const { t } = useTranslation('tasks')
  const createTask = useCreateTask()

  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [dateValue, setDateValue] = useState<DateBucketValue>({})

  useEffect(() => {
    if (!open) return
    setTitle('')
    let inferredDuration: number | undefined
    if (defaultStart && defaultEnd) {
      const ms = new Date(defaultEnd).getTime() - new Date(defaultStart).getTime()
      if (Number.isFinite(ms) && ms > 0) inferredDuration = Math.round(ms / 60_000)
    }
    setDuration(inferredDuration)
    setDateValue({
      scheduledDate: defaultDate ?? null,
      scheduledBucket: defaultBucket ?? (defaultDate ? 'TODAY' : null),
    })
  }, [open, defaultDate, defaultBucket, defaultStart, defaultEnd])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    try {
      await createTask.mutateAsync({
        title: trimmed,
        priority: 'medium',
        estimatedDuration: duration,
        scheduledDate: dateValue.scheduledDate ?? undefined,
        scheduledBucket: dateValue.scheduledBucket ?? null,
        scheduledStart: defaultStart,
        scheduledEnd: defaultEnd,
        tags: [],
      } as any)
      toast.success(t('taskCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('createTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="quick-title">{t('titleLabel')}</Label>
              <Input
                id="quick-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titlePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('estimatedDuration')}</Label>
                <DurationCombobox
                  value={duration}
                  onChange={setDuration}
                  presets={DURATION_PRESETS}
                  placeholder={t('selectDuration')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('scheduledDate')}</Label>
                <DateBucketPicker
                  value={dateValue}
                  onChange={setDateValue}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('quickHint', { defaultValue: 'More options (subtasks, exact time, repeat, channel, weekly goal) are available after creating the task.' })}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={createTask.isPending || !title.trim()}>
              {createTask.isPending ? t('common:loading', { defaultValue: 'Loading...' }) : t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
