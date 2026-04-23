import { useTranslation } from 'react-i18next'
import { Archive, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'
import { CheckIcon } from '@/shared/components/Icons'
import type { Habit } from '@repo/shared/types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HabitListCard({
  habit,
  today,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onView,
}: {
  habit: Habit
  today: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onView: () => void
}) {
  const { t } = useTranslation('habits')
  const todayLog = habit.logs?.find((l) => l.date.startsWith(today))
  const completedCount = todayLog?.completedCount ?? 0
  const isComplete = completedCount >= habit.targetFrequency
  const progress = habit.targetFrequency > 0 ? Math.min(completedCount / habit.targetFrequency, 1) : 0

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:border-border hover:shadow-md" onClick={onView}>
      <CardContent className="p-0">
        <div className="flex items-stretch gap-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="flex shrink-0 items-center justify-center w-14 transition-colors hover:bg-muted/50"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all"
              style={
                isComplete
                  ? { backgroundColor: habit.color || '#3b82f6', borderColor: habit.color || '#3b82f6', color: '#fff' }
                  : { borderColor: habit.color || '#3b82f6', color: habit.color || '#3b82f6' }
              }
            >
              {isComplete ? (
                <CheckIcon size={16} />
              ) : habit.targetFrequency > 1 ? (
                <span className="text-[10px] font-bold">{completedCount}/{habit.targetFrequency}</span>
              ) : null}
            </div>
          </button>

          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className={`text-sm font-semibold leading-tight ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {habit.name}
                </p>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none data-[state=open]:opacity-100"
                    aria-label={t('more', { ns: 'common' })}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="size-3.5" />
                      {t('edit', { ns: 'common' })}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onArchive}>
                      <Archive className="size-3.5" />
                      {t('archive')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                      <Trash2 className="size-3.5" />
                      {t('delete', { ns: 'common' })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {habit.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{habit.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {habit.category && (
                <Badge variant="secondary" className="text-[10px] py-0.5">{habit.category}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {habit.frequencyType === 'daily' && t('displayDaily')}
                {habit.frequencyType === 'week_days' && `${habit.weekDays.map((d) => DAY_LABELS[d]).join(', ')}`}
                {habit.frequencyType === 'times_per_week' && `${habit.targetFrequency}${t('displayPerWeek')}`}
              </span>
            </div>

            {habit.targetFrequency > 1 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: habit.color || 'var(--color-primary)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
