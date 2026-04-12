import { TaskItem } from '@/components/task-item'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import type { Task } from '@repo/shared/types'
import { useTranslation } from 'react-i18next'

interface ArchivePanelProps {
  tasks: Task[]
  onReschedule: (task: Task, date: string) => void
  onDelete: (task: Task) => void
}

export function ArchivePanel({ tasks, onReschedule, onDelete }: ArchivePanelProps) {
  const { t } = useTranslation('tasks')

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <EmptyState title={t('noArchived')} description={t('noArchivedDescription')} />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">{t('archived')}</h3>
        <p className="text-xs text-muted-foreground">
          {tasks.length} {t('archivedTasks')}
        </p>
      </div>
      <ScrollArea className="max-h-[400px]">
        <div className="p-2 space-y-1">
          {tasks.map((task) => (
            <div key={task.id} className="group flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <TaskItem
                  task={task}
                  onToggle={() => {}}
                  size="sm"
                />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]!
                    onReschedule(task, today)
                  }}
                >
                  {t('rescheduleToday')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-destructive hover:text-destructive"
                  onClick={() => onDelete(task)}
                >
                  {t('remove')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
