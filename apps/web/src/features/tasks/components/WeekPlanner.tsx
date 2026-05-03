import { useMemo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskItem } from '@/shared/components/TaskItem'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { PlusIcon } from '@/shared/components/Icons'
import { format, addDays, isToday } from 'date-fns'
import type { Locale } from 'date-fns'
import type { Task } from '@repo/shared/types'
import { useLocale } from '@/i18n/useLocale'

interface WeekPlannerProps {
  tasks: Task[]
  weekStart: Date
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onArchive?: (task: Task) => void
  onMoveToDay: (taskId: string, newDate: string) => void
  onQuickAdd: (date: string) => void
}

export function WeekPlanner({
  tasks,
  weekStart,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onMoveToDay,
  onQuickAdd,
}: WeekPlannerProps) {
  const { dateFnsLocale } = useLocale()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      map.set(key, [])
    }
    for (const task of tasks) {
      if (task.scheduledDate) {
        const key = task.scheduledDate.split('T')[0]!
        const existing = map.get(key)
        if (existing) existing.push(task)
      }
    }
    return map
  }, [tasks, days])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((x) => x.id === String(event.active.id))
      setActiveTask(task ?? null)
    },
    [tasks],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over) return

      const taskId = String(active.id)
      const overId = String(over.id)

      let targetDate: string | null = null
      if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
        targetDate = overId
      } else {
        // Dropped on another task — resolve its day
        for (const [dateKey, dayTasks] of tasksByDay.entries()) {
          if (dayTasks.some((x) => x.id === overId)) {
            targetDate = dateKey
            break
          }
        }
      }
      if (!targetDate) return

      const source = tasks.find((x) => x.id === taskId)
      const sourceDate = source?.scheduledDate?.split('T')[0]
      if (sourceDate === targetDate) return

      onMoveToDay(taskId, targetDate)
    },
    [onMoveToDay, tasksByDay, tasks],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="overflow-x-auto">
        <div className="grid gap-4 min-h-[calc(100vh-200px)]" style={{ gridTemplateColumns: 'repeat(7, 320px)' }}>
          {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDay.get(dateKey) ?? []
          const openCount = dayTasks.filter((t) => t.status === 'open').length
          const today = isToday(day)

          return (
            <DayColumn
              key={dateKey}
              dateKey={dateKey}
              day={day}
              tasks={dayTasks}
              isToday={today}
              openCount={openCount}
              dateFnsLocale={dateFnsLocale}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              onQuickAdd={() => onQuickAdd(dateKey)}
            />
          )
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[288px] opacity-95 shadow-2xl rounded-lg rotate-1 pointer-events-none">
            <TaskItem
              task={activeTask}
              onToggle={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ---------------------------------------------------------------------------
// Day column (droppable)
// ---------------------------------------------------------------------------
interface DayColumnProps {
  dateKey: string
  day: Date
  tasks: Task[]
  isToday: boolean
  openCount: number
  dateFnsLocale: Locale | undefined
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onArchive?: (task: Task) => void
  onQuickAdd: () => void
}

function DayColumn({
  dateKey,
  day,
  tasks,
  isToday: today,
  openCount,
  dateFnsLocale,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onQuickAdd,
}: DayColumnProps) {
  const { t } = useTranslation('tasks')
  const { setNodeRef, isOver } = useDroppable({ id: dateKey })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-0 rounded-xl border-2 p-4 backdrop-blur-xs transition-colors ${
        isOver
          ? 'border-primary bg-primary/20'
          : today
            ? 'border-primary/50 bg-primary/10'
            : 'border-border/50 bg-card/50'
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <span
            className={`text-xs font-semibold uppercase tracking-wider block ${
              today ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {format(day, 'EEE', { locale: dateFnsLocale })}
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${
              today
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground'
            }`}
          >
            {format(day, 'd')}
          </span>
        </div>
        {openCount > 0 && (
          <Badge variant="destructive" className="text-xs font-semibold">
            {openCount}
          </Badge>
        )}
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1 pr-3 mb-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <SortableWeekTask
                key={task.id}
                task={task}
                onToggle={() => onToggle(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task)}
                onArchive={onArchive ? () => onArchive(task) : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>

      {tasks.length === 0 && (
        <p className="text-center text-xs text-muted-foreground/60 mb-3 py-4">
          {today ? t('weekly.noTasksToday') : t('noTasks')}
        </p>
      )}

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs font-medium border-dashed border-primary/30 hover:border-primary/50"
        onClick={onQuickAdd}
      >
        <PlusIcon size={14} className="mr-1" /> {t('addTask')}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable task in week view
// ---------------------------------------------------------------------------
function SortableWeekTask({
  task,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
}: {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dragHandle = (
    <button
      type="button"
      className="flex-shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="6" r="2" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="8" cy="18" r="2" />
        <circle cx="16" cy="18" r="2" />
      </svg>
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
        dragHandle={dragHandle}
      />
    </div>
  )
}
