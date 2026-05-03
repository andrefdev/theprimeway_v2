import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { tasksApi } from '@/features/tasks/api'
import { schedulingApi } from '@/features/scheduling/api'
import { channelsApi } from '../channels-api'
import { parseCapture } from '../parser'
import { schedulingKeys } from '@/features/scheduling/queries'
import { useUserTimezone } from '@/features/settings/hooks/use-user-timezone'

interface Props {
  open: boolean
  onClose: () => void
}

export function CaptureDialog({ open, onClose }: Props) {
  const { t } = useTranslation('capture')
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const channelsQuery = useQuery({
    queryKey: ['channels', 'list'],
    queryFn: () => channelsApi.list(),
    enabled: open,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (open) {
      setText('')
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  const tz = useUserTimezone()
  const parsed = useMemo(() => parseCapture(text, new Date(), tz), [text, tz])
  const matchedChannel = useMemo(() => {
    if (!parsed.channelName) return null
    const lower = parsed.channelName.toLowerCase()
    return (
      channelsQuery.data?.find(
        (c) => c.name.replace(/^#/, '').toLowerCase() === lower,
      ) ?? null
    )
  }, [parsed.channelName, channelsQuery.data])

  const createMutation = useMutation({
    mutationFn: async ({ schedule }: { schedule: boolean }) => {
      if (!parsed.title) throw new Error('Title required')
      const task = await tasksApi.create({
        title: parsed.title,
        ...(parsed.plannedMinutes ? { estimatedDurationMinutes: parsed.plannedMinutes } : {}),
        ...(parsed.day ? { scheduledDate: parsed.day } : {}),
        ...(parsed.bucket ? { scheduledBucket: parsed.bucket } : {}),
        ...(matchedChannel ? ({ channelId: matchedChannel.id } as any) : {}),
      } as any)
      if (schedule && parsed.day) {
        const result = await schedulingApi.autoSchedule({ taskId: task.data.id, day: parsed.day })
        return { task: task.data, scheduled: result }
      }
      return { task: task.data, scheduled: null as null | unknown }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      const scheduled = (res as any).scheduled
      if (scheduled && scheduled.type === 'Success') {
        toast.success(`Captured & scheduled: ${parsed.title}`)
      } else if (scheduled && scheduled.type === 'Overcommitted') {
        toast.warning(`Captured "${parsed.title}" — couldn't schedule (${scheduled.reason})`)
      } else {
        toast.success(`Captured: ${parsed.title}`)
      }
      onClose()
    },
    onError: (err) => toast.error((err as Error).message || t('toast.failed', { defaultValue: 'Failed to capture' })),
  })

  function submit(schedule: boolean) {
    if (!parsed.title || createMutation.isPending) return
    createMutation.mutate({ schedule })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <div className="border-b px-4 py-3">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit(e.shiftKey)
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
            placeholder={t('placeholder', { defaultValue: 'e.g. "30m write blog post #writing @tomorrow"' })}
            className="w-full bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="px-4 py-3 space-y-2 text-sm">
          <PreviewRow label={t('labels.title', { defaultValue: 'Title' })} value={parsed.title || <span className="text-muted-foreground">{t('pending', { defaultValue: '(pending)' })}</span>} />
          <PreviewRow
            label={t('labels.planned', { defaultValue: 'Planned' })}
            value={
              parsed.plannedMinutes
                ? <span className="tabular-nums">{formatMinutes(parsed.plannedMinutes)}</span>
                : <span className="text-muted-foreground">—</span>
            }
          />
          <PreviewRow
            label={t('labels.day', { defaultValue: 'Day' })}
            value={
              parsed.day
                ? parsed.day
                : parsed.bucket
                  ? <span className="capitalize">{parsed.bucket.toLowerCase().replace(/_/g, ' ')}</span>
                  : <span className="text-muted-foreground">—</span>
            }
          />
          <PreviewRow
            label={t('labels.channel', { defaultValue: 'Channel' })}
            value={
              parsed.channelName
                ? matchedChannel
                  ? <span style={{ color: matchedChannel.color }}>#{matchedChannel.name.replace(/^#/, '')}</span>
                  : <span className="text-amber-600 dark:text-amber-400">#{parsed.channelName} (not found)</span>
                : <span className="text-muted-foreground">—</span>
            }
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span>{t('help', { defaultValue: 'Enter: capture · Shift+Enter: capture & schedule · Esc: close' })}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => submit(false)} disabled={!parsed.title || createMutation.isPending}>
              {t('buttons.capture', { defaultValue: 'Capture' })}
            </Button>
            <Button size="sm" onClick={() => submit(true)} disabled={!parsed.title || createMutation.isPending}>
              {createMutation.isPending ? t('buttons.working', { defaultValue: 'Working…' }) : t('buttons.captureSchedule', { defaultValue: 'Capture & schedule' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex-1 truncate">{value}</span>
    </div>
  )
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`
}
