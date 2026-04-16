import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CompletionToggle } from '@/shared/components/CompletionToggle'
import { Card, CardContent } from '@/shared/components/ui/card'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { QueryError } from '@/shared/components/QueryError'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTask } from '@/features/tasks/queries'
import type { Task } from '@repo/shared/types'
import { UseQueryResult } from '@tanstack/react-query'

interface TodayTasksListProps {
  tasks: Task[]
  tasksQuery: UseQueryResult<any>
}

export function TodayTasksList({ tasks, tasksQuery }: TodayTasksListProps) {
  const { t } = useTranslation('dashboard')
  const updateTask = useUpdateTask()

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'completed' ? 'open' : 'completed'
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: newStatus } })
      toast.success(newStatus === 'completed' ? t('taskCompleted') : t('taskReopened'))
    } catch {
      toast.error(t('failedToUpdateTask'))
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{t('todaysTasks')}</h3>
          <Link to="/tasks/today" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t('viewAll', { ns: 'common' })}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {tasksQuery.isLoading ? (
          <SkeletonList lines={3} />
        ) : tasksQuery.isError ? (
          <QueryError message={t('failedToLoadTasks')} onRetry={() => tasksQuery.refetch()} />
        ) : tasks.length > 0 ? (
          <div className="space-y-0.5">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <CompletionToggle
                  completed={task.status === 'completed'}
                  onClick={() => toggleTask(task)}
                />
                <span
                  className={`text-sm flex-1 ${
                    task.status === 'completed'
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}
                >
                  {task.title}
                </span>
                {task.priority === 'high' && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t('high', { ns: 'common' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('allClear')}
            description={t('noTasksToday')}
          />
        )}
      </CardContent>
    </Card>
  )
}
