import { useState } from 'react'
import { Badge } from '@/shared/components/ui/badge'
import { CompletionToggle } from './CompletionToggle'
import { TaskTimerButton } from '@/features/tasks/components/TaskTimerButton'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { EditIcon, TrashIcon } from './Icons'
import { ArchiveIcon } from 'lucide-react'
import type { Task } from '@repo/shared/types'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
  onArchive?: () => void
  size?: 'sm' | 'md'
  showDate?: boolean
  dragHandle?: React.ReactNode
}

const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  low: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  size = 'md',
  showDate,
  dragHandle,
}: TaskItemProps) {
  const { locale } = useLocale()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isCompleted = task.status === 'completed'
  const paddingClass = size === 'sm' ? 'px-3 py-2' : 'px-4 py-3'
  const priorityStyle =
    PRIORITY_COLOR[task.priority] || {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
    }

  const menu = (
    <ContextMenuContent>
      {onEdit && (
        <ContextMenuItem onSelect={() => onEdit()}>
          <EditIcon /> Edit
        </ContextMenuItem>
      )}
      {onArchive && (
        <ContextMenuItem onSelect={() => onArchive()}>
          <ArchiveIcon /> Archive
        </ContextMenuItem>
      )}
      {onDelete && (
        <>
          {(onEdit || onArchive) && <ContextMenuSeparator />}
          <ContextMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <TrashIcon /> Delete
          </ContextMenuItem>
        </>
      )}
    </ContextMenuContent>
  )

  const confirmDialog = onDelete ? (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this task? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete()
              setConfirmOpen(false)
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null

  // For kanban view (size='md'), use a card layout
  if (size === 'md') {
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="group rounded-md border border-border/50 bg-card hover:border-border transition-all hover:shadow-md overflow-hidden">
              <div className="p-4 space-y-3">
                {dragHandle && <div className="flex justify-end -mt-2 -mr-2">{dragHandle}</div>}

                <div className="space-y-1.5">
                  <p className={`text-sm font-medium leading-snug break-words line-clamp-3 ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
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
                  <TaskTimerButton task={task} />
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          {menu}
        </ContextMenu>
        {confirmDialog}
      </>
    )
  }

  // Original list view (size='sm') — horizontal compact layout
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={`group flex items-center gap-3 rounded-md border border-border/50 bg-card/50 transition-all hover:bg-card hover:border-border ${paddingClass}`}>
            {dragHandle}
            <CompletionToggle completed={isCompleted} onClick={onToggle} size={size} />

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium break-words line-clamp-3 ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {showDate && task.scheduledDate && (
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

            <TaskTimerButton task={task} />
          </div>
        </ContextMenuTrigger>
        {menu}
      </ContextMenu>
      {confirmDialog}
    </>
  )
}
