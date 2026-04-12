import { Badge } from '@/components/ui/badge'
import { CompletionToggle } from './completion-toggle'
import { EditButton, DeleteButton } from './action-buttons'
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

const PRIORITY_INDICATOR: Record<string, string> = {
  high: 'border-l-destructive',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-400',
}

export function TaskItem({ task, onToggle, onEdit, onDelete, size = 'md', showDate, dragHandle }: TaskItemProps) {
  const isCompleted = task.status === 'completed'
  const paddingClass = size === 'sm' ? 'px-2 py-1.5' : 'px-4 py-3'

  // For kanban view (size='md'), use a card layout
  if (size === 'md') {
    const statusColor = task.status === 'completed' ? 'bg-green-500/20' : 'bg-blue-500/20'
    const statusLabel = task.status === 'completed' ? 'completed' : task.priority || 'open'

    return (
      <div
        className={`group rounded-lg border border-border/50 bg-card/70 backdrop-blur-xs overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg ${PRIORITY_INDICATOR[task.priority] ?? 'border-l-2 border-l-muted'}`}
      >
        <div className="p-4 space-y-2.5">
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
            <Badge className={`text-[10px] capitalize ${statusColor}`}>
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <CompletionToggle completed={isCompleted} onClick={onToggle} size="sm" />
            <div className="flex items-center gap-1">
              {onEdit && <EditButton onClick={onEdit} />}
              {onDelete && <DeleteButton onClick={onDelete} />}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Original list view (size='sm')
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-transparent border-l-2 transition-colors hover:border-border hover:bg-card ${PRIORITY_INDICATOR[task.priority] ?? ''} ${paddingClass}`}
    >
      {dragHandle}
      <CompletionToggle completed={isCompleted} onClick={onToggle} size={size} />

      <div className="flex-1 min-w-0">
        <p className={`text-xs ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {showDate && task.scheduledDate && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(task.scheduledDate).toLocaleDateString()}
            </span>
          )}
          {task.estimatedDuration && (
            <span className="text-[10px] text-muted-foreground">
              {task.estimatedDuration >= 60
                ? `${Math.floor(task.estimatedDuration / 60)}h${task.estimatedDuration % 60 ? ` ${task.estimatedDuration % 60}m` : ''}`
                : `${task.estimatedDuration}m`}
            </span>
          )}
        </div>
      </div>

      {task.priority === 'high' && (
        <Badge variant="destructive" className="text-[9px]">
          {task.priority}
        </Badge>
      )}

      <div className="flex items-center gap-0.5">
        {onEdit && <EditButton onClick={onEdit} />}
        {onDelete && <DeleteButton onClick={onDelete} />}
      </div>
    </div>
  )
}
