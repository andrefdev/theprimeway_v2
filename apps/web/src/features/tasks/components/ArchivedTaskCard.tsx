import { Badge } from '@/shared/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import type { Task } from '@repo/shared/types'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'

interface ArchivedTaskCardProps {
  task: Task
}

const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  low: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
}

export function ArchivedTaskCard({ task }: ArchivedTaskCardProps) {
  const { locale } = useLocale()
  const priorityStyle =
    PRIORITY_COLOR[task.priority] || {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
    }

  return (
    <div className="min-w-0 flex-1">
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <p className="text-sm font-medium text-foreground break-words line-clamp-2">
            {task.title}
          </p>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-sm whitespace-pre-wrap break-words">
          {task.title}
        </TooltipContent>
      </Tooltip>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {task.scheduledDate && (
          <span className="text-[11px] text-muted-foreground">
            {formatDate(task.scheduledDate, locale)}
          </span>
        )}
        {task.estimatedDuration && (
          <span className="text-[11px] text-muted-foreground">
            {task.estimatedDuration >= 60
              ? `${Math.floor(task.estimatedDuration / 60)}h`
              : `${task.estimatedDuration}m`}
          </span>
        )}
        {task.priority && (
          <Badge className={`text-[10px] font-semibold capitalize ${priorityStyle.bg} ${priorityStyle.text} border-0 py-0.5`}>
            {task.priority}
          </Badge>
        )}
      </div>
    </div>
  )
}
