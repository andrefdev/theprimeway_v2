import { useState } from 'react'
import { TaskItem } from '@/shared/components/TaskItem'
import { Badge } from '@/shared/components/ui/badge'
import { ChevronRightIcon } from '@/shared/components/Icons'
import type { Task } from '@repo/shared/types'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'
import type { SupportedLocale } from '@/i18n/config'

interface TaskGroupProps {
  dateKey: string
  tasks: Task[]
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  defaultOpen?: boolean
}

export function TaskGroup({
  dateKey,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  defaultOpen = true,
}: TaskGroupProps) {
  const { t } = useTranslation('tasks')
  const { locale } = useLocale()
  const [open, setOpen] = useState(defaultOpen)
  const openCount = tasks.filter((t) => t.status === 'open').length
  const label = formatDateKey(dateKey, t, locale)

  return (
    <div className="space-y-1">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <ChevronRightIcon
          size={14}
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span>{label}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {openCount}/{tasks.length}
        </Badge>
      </button>

      {/* Tasks */}
      {open && (
        <div className="ml-2 space-y-0.5">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggle(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              showDate={dateKey === 'no-date'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function formatDateKey(key: string, t: (k: string) => string, locale: SupportedLocale): string {
  if (key === 'today') return t('groupToday')
  if (key === 'tomorrow') return t('groupTomorrow')
  if (key === 'overdue') return t('groupOverdue')
  if (key === 'no-date') return t('groupNoDate')
  if (key === 'upcoming') return t('groupUpcoming')

  // Fallback: assume it's a date string (YYYY-MM-DD)
  try {
    const [year, month, day] = key.split('-').map(Number) as [number, number, number]
    const date = new Date(year, month - 1, day)
    return formatDate(date, locale, { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return key
  }
}
