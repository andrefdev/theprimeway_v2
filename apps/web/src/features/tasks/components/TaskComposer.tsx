import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { TaskBucket } from '@repo/shared/types'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Textarea } from '@/shared/components/ui/textarea'
import { ArrowUp as ArrowUpIcon } from 'lucide-react'
import { useCreateTask } from '../queries'
import {
  InlineBucketPicker,
  InlineChannelPicker,
  InlineDurationPicker,
  InlineWeeklyGoalPicker,
  type InlineBucketValue,
} from './form/pickers'

interface TaskComposerProps {
  defaultBucket?: TaskBucket | null
  onCreated?: () => void
  placeholder?: string
}

export function TaskComposer({ defaultBucket, onCreated, placeholder }: TaskComposerProps) {
  const { t } = useTranslation('tasks')
  const createTask = useCreateTask()

  const [title, setTitle] = useState('')
  const [bucketValue, setBucketValue] = useState<InlineBucketValue>({
    bucket: defaultBucket ?? 'TODAY',
  })
  const [duration, setDuration] = useState<number | undefined>()
  const [channelId, setChannelId] = useState<string | undefined>()
  const [weeklyGoalId, setWeeklyGoalId] = useState<string | undefined>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (defaultBucket !== undefined) setBucketValue({ bucket: defaultBucket ?? null })
  }, [defaultBucket])

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      textareaRef.current?.focus()
      return
    }
    const payload: Record<string, unknown> = {
      title: trimmed,
      estimatedDuration: duration,
      channelId: channelId ?? null,
      weeklyGoalId,
    }
    if (bucketValue.bucket === 'EXACT_DATE' && bucketValue.exactDate) {
      payload.scheduledDate = bucketValue.exactDate
      payload.isAllDay = true
    } else if (bucketValue.bucket && bucketValue.bucket !== 'EXACT_DATE') {
      payload.scheduledBucket = bucketValue.bucket
      if (bucketValue.bucket === 'TODAY' || bucketValue.bucket === 'TOMORROW') {
        const d = new Date()
        if (bucketValue.bucket === 'TOMORROW') d.setDate(d.getDate() + 1)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        payload.scheduledDate = `${y}-${m}-${day}`
        payload.isAllDay = true
      }
    }

    try {
      await createTask.mutateAsync(payload as any)
      toast.success(t('taskCreated'))
      setTitle('')
      setDuration(undefined)
      setChannelId(undefined)
      setWeeklyGoalId(undefined)
      setBucketValue({ bucket: defaultBucket ?? 'TODAY' })
      onCreated?.()
      textareaRef.current?.focus()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Card className="rounded-xl bg-card/60 p-3 py-3 gap-3">
      <Textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t('composer.placeholder', { defaultValue: 'Task description…' })}
        rows={2}
        className="resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed placeholder:text-muted-foreground/70"
      />

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <InlineBucketPicker value={bucketValue} onChange={setBucketValue} />
        <InlineDurationPicker value={duration} onChange={setDuration} />
        <InlineChannelPicker value={channelId} onChange={setChannelId} />
        <InlineWeeklyGoalPicker value={weeklyGoalId} onChange={setWeeklyGoalId} />

        <div className="ml-auto">
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={createTask.isPending || !title.trim()}
            className="h-8 w-8 p-0 rounded-full"
            aria-label={t('composer.submit', { defaultValue: 'Add task' })}
          >
            <ArrowUpIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
