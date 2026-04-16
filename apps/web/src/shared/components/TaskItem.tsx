import { Badge } from '@/shared/components/ui/badge'
import { CompletionToggle } from './CompletionToggle'
import { EditButton, DeleteButton } from './ActionButtons'
import { TaskTimerButton } from '@/features/tasks/components/TaskTimerButton'
import type { Task } from '@repo/shared/types'

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
  size?: 'sm' | 'md'
  showDate?: boolean
  dragHandle?: React.ReactNode
}

const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  low: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
}

export function TaskItem({ task, onToggle, onEdit, onDelete, size = 'md', showDate, dragHandle }: TaskItemProps) {
  const isCompleted = task.status === 'completed'
  const paddingClass = size === 'sm' ? 'px-3 py-2' : 'px-4 py-3'
  const priorityStyle = PRIORITY_COLOR[task.priority] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' }

  // For kanban view (size='md'), use a card layout
  if (size === 'md') {
    return (
      <div
        className="group rounded-xl border border-border/50 bg-card hover:border-border transition-all hover:shadow-md overflow-hidden"
      >
        <div className="p-4 space-y-3">
          {dragHandle && <div className="flex justify-end -mt-2 -mr-2">{dragHandle}</div>}

          <div className="space-y-1.5">
            <p className={`text-sm font-medium leading-snug ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {task.estimatedDuration && (
              <Badge variant="outline" className="text-[10px]">
                {task.estimatedDuration >= 60
                  ? `${Math.floor(task.estimatedDuration / 60)}h${task.estimatedDuration % 60 ? ` ${task.estimatedDuration % 60}m` : ''}`
                  : `${task.estimatedDuration}m`}
              </Badge>
            )}
            {task.priority && (
              <Badge className={`text-[10px] font-semibold capitalize ${priorityStyle.bg} ${priorityStyle.text} border-0`}>
                {task.priority}
              </Badge>
            )}
            {task.status === 'completed' && (
              <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                done
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <CompletionToggle completed={isCompleted} onClick={onToggle} size="sm" />
            <div className="flex items-center gap-1">
              <TaskTimerButton task={task} />
              {onEdit && <EditButton onClick={onEdit} />}
              {onDelete && <DeleteButton onClick={onDelete} />}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Original list view (size='sm') — horizontal compact layout
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 transition-all hover:bg-card hover:border-border ${paddingClass}`}
    >
      {dragHandle}
      <CompletionToggle completed={isCompleted} onClick={onToggle} size={size} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {showDate && task.scheduledDate && (
            <span className="text-[11px] text-muted-foreground">
              {new Date(task.scheduledDate).toLocaleDateString()}
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

      <div className="flex items-center gap-0.5">
        <TaskTimerButton task={task} />
        {onEdit && <EditButton onClick={onEdit} />}
        {onDelete && <DeleteButton onClick={onDelete} />}
      </div>
    </div>
  )
}
