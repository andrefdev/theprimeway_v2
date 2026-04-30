import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Check, Hash, Target as TargetIcon, Clock, Tag } from 'lucide-react'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { channelsApi } from '@/features/capture/channels-api'
import { goalsQueries } from '@/features/goals/queries'
import type { Task } from '@repo/shared/types'

interface Props {
  task: Task | null
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
}

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

/**
 * Calendar-style quick-view popover for tasks. Mirrors EventQuickView.
 */
export function TaskQuickView({
  task,
  anchorEl,
  open,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}: Props) {
  const { t } = useTranslation('tasks')
  const [rect, setRect] = useState<DOMRect | null>(null)

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', 'list'],
    queryFn: channelsApi.list,
    enabled: open,
  })
  const { data: goals = [] } = useQuery({ ...goalsQueries.weeklyGoals(), enabled: open })

  useEffect(() => {
    if (!open || !anchorEl) {
      setRect(null)
      return
    }
    const update = () => setRect(anchorEl.getBoundingClientRect())
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorEl])

  if (!task) return null

  const channel = channels.find((c: any) => c.id === task.channelId)
  const goal = (goals as any[]).find((g) => g.id === (task as any).weeklyGoalId)

  const start = task.scheduledStart ? new Date(task.scheduledStart) : null
  const end = task.scheduledEnd ? new Date(task.scheduledEnd) : null
  const sameDay = start && end ? start.toDateString() === end.toDateString() : true

  const timeLine = start && end
    ? sameDay
      ? `${format(start, 'EEE, MMM d')} · ${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
      : `${format(start, 'EEE, MMM d, h:mm a')} – ${format(end, 'EEE, MMM d, h:mm a')}`
    : task.scheduledDate
      ? format(parseLocalDate(task.scheduledDate)!, 'EEE, MMM d')
      : t('noDate', { defaultValue: 'No date' })

  const isCompleted = task.status === 'completed'

  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      {rect && (
        <PopoverAnchor asChild>
          <div
            style={{
              position: 'fixed',
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              pointerEvents: 'none',
            }}
          />
        </PopoverAnchor>
      )}
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        collisionPadding={16}
        className="w-80 max-w-[calc(100vw-32px)] space-y-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-1.5 size-2.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-muted'}`} />
          <div className="min-w-0 flex-1">
            <div
              className={`text-base font-medium leading-tight break-words ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
            >
              {task.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{timeLine}</div>
          </div>
        </div>

        {task.estimatedDuration && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{task.estimatedDuration} min</span>
          </div>
        )}

        {channel && (
          <div className="flex items-center gap-2 text-xs">
            <Hash size={12} className="text-muted-foreground" />
            <span>{channel.name}</span>
          </div>
        )}

        {goal && (
          <div className="flex items-center gap-2 text-xs">
            <TargetIcon size={12} className="text-muted-foreground" />
            <span className="truncate">{goal.title}</span>
          </div>
        )}

        {task.description && (
          <div className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-6">
            {task.description}
          </div>
        )}

        {task.tags.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <Tag size={12} className="mt-1 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-1 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={onToggleComplete}
          >
            <Check size={14} />
            {isCompleted ? t('reopen', { defaultValue: 'Reopen' }) : t('complete', { defaultValue: 'Complete' })}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1" onClick={onDelete}>
              <Trash2 size={14} />
            </Button>
            <Button variant="default" size="sm" className="gap-1" onClick={onEdit}>
              <Pencil size={14} />
              {t('edit', { ns: 'common', defaultValue: 'Edit' })}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function parseLocalDate(s: string): Date | undefined {
  const ymd = s.includes('T') ? s.split('T')[0]! : s
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
