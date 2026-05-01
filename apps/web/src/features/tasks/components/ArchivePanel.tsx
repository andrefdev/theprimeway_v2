import { TaskItem } from '@/shared/components/TaskItem'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Switch } from '@/shared/components/ui/switch'
import { EmptyState } from '@/shared/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { DateBucketPicker, type DateBucketValue } from '@/features/tasks/components/DateBucketPicker'
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import type { Task } from '@repo/shared/types'
import { useTranslation } from 'react-i18next'
import { AUTO_ARCHIVE_DAY_OPTIONS } from '@/shared/hooks/use-auto-archive-settings'

interface ArchivePanelProps {
  tasks: Task[]
  autoArchive: boolean
  onAutoArchiveChange: (v: boolean) => void
  rolloverDays: number
  onRolloverDaysChange: (n: number) => void
  onReschedule: (task: Task, date: string) => void
  onDelete: (task: Task) => void
  onDeleteAll: () => void
}

export function ArchivePanel({
  tasks,
  autoArchive,
  onAutoArchiveChange,
  rolloverDays,
  onRolloverDaysChange,
  onReschedule,
  onDelete,
  onDeleteAll,
}: ArchivePanelProps) {
  const { t } = useTranslation('tasks')

  return (
    <Card className="sticky top-4 py-0 gap-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs">
        <label htmlFor="auto-archive-switch" className="cursor-pointer select-none text-muted-foreground">
          {t('autoArchive', { defaultValue: 'Auto-archive' })}
        </label>
        <Switch
          id="auto-archive-switch"
          size="sm"
          checked={autoArchive}
          onCheckedChange={onAutoArchiveChange}
        />
      </div>

      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-base font-semibold">{t('archived')}</h3>
        {tasks.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1 text-xs text-muted-foreground hover:text-destructive"
              >
                {t('deleteAll', { defaultValue: 'Delete all' })}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('deleteAllConfirmTitle', { defaultValue: 'Delete all archived tasks?' })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteAllConfirmBody', {
                    count: tasks.length,
                    defaultValue: `This will permanently delete ${tasks.length} archived task(s). This cannot be undone.`,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel', { ns: 'common', defaultValue: 'Cancel' })}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDeleteAll}>
                  {t('deleteAll', { defaultValue: 'Delete all' })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="px-3 pb-2 pt-1 text-xs text-muted-foreground">
        <span>
          {t('rolloverPrefix', { defaultValue: 'Tasks which have rolled over at least:' })}{' '}
        </span>
        <Select value={String(rolloverDays)} onValueChange={(v) => onRolloverDaysChange(Number(v))}>
          <SelectTrigger
            size="sm"
            className="inline-flex h-auto w-auto gap-1 border-0 bg-transparent px-1 py-0 text-xs underline underline-offset-2 shadow-none hover:text-foreground focus:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTO_ARCHIVE_DAY_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          {' '}
          {t('rolloverSuffix', { defaultValue: 'consecutive days' })}
        </span>
      </div>

      {tasks.length === 0 ? (
        <CardContent className="p-4">
          <EmptyState title={t('noArchived')} description={t('noArchivedDescription')} />
        </CardContent>
      ) : (
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-2 pb-2 pt-1 space-y-1.5">
          {tasks.map((task) => (
            <ArchivedTaskRow
              key={task.id}
              task={task}
              onReschedule={onReschedule}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

interface ArchivedTaskRowProps {
  task: Task
  onReschedule: (task: Task, date: string) => void
  onDelete: (task: Task) => void
}

function ArchivedTaskRow({ task, onReschedule, onDelete }: ArchivedTaskRowProps) {
  const { t } = useTranslation('tasks')

  return (
    <div className="group flex items-start gap-2 rounded-md bg-muted/30 px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <TaskItem task={task} onToggle={() => {}} />
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <DateBucketPicker
          value={{ scheduledDate: null, scheduledBucket: null }}
          onChange={(v: DateBucketValue) => {
            const date = v.scheduledDate ?? new Date().toISOString().split('T')[0]!
            onReschedule(task, date)
          }}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              aria-label={t('reschedule', { defaultValue: 'Reschedule' })}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              aria-label={t('delete', { ns: 'common', defaultValue: 'Delete' })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('deleteTaskConfirmTitle', { defaultValue: 'Delete this task?' })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteTaskConfirmBody', {
                  title: task.title,
                  defaultValue: `"${task.title}" will be permanently deleted. This cannot be undone.`,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('cancel', { ns: 'common', defaultValue: 'Cancel' })}
              </AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDelete(task)}>
                {t('delete', { ns: 'common', defaultValue: 'Delete' })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
