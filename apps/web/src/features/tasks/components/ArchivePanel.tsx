import { TaskItem } from '@/shared/components/TaskItem'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { EmptyState } from '@/shared/components/ui/empty-state'
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
      <Card>
        <CardContent className="p-4">
          <EmptyState title={t('noArchived')} description={t('noArchivedDescription')} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0 gap-0">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm">{t('archived')}</CardTitle>
        <CardDescription className="text-xs">
          {tasks.length} {t('archivedTasks')}
        </CardDescription>
      </CardHeader>
      <ScrollArea className="max-h-[400px]">
        <div className="p-2 space-y-1">
          {tasks.map((task) => (
            <div key={task.id} className="group flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <TaskItem
                  task={task}
                  onToggle={() => {}}
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
    </Card>
  )
}
