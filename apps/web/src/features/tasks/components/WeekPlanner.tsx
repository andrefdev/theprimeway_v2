import { useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskItem } from '@/components/TaskItem'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlusIcon } from '@/components/Icons'
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
  onMoveToDay: (taskId: string, newDate: string) => void
  onQuickAdd: (date: string) => void
}

export function WeekPlanner({
  tasks,
  weekStart,
  onToggle,
  onEdit,
  onDelete,
  onMoveToDay,
  onQuickAdd,
}: WeekPlannerProps) {
  const { dateFnsLocale } = useLocale()

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const taskId = String(active.id)
      const targetDate = String(over.id)

      // Check if dropped on a day column
      if (targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        onMoveToDay(taskId, targetDate)
      }
    },
    [onMoveToDay],
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <div className="grid gap-4 min-h-[calc(100vh-200px)] min-w-max" style={{ gridTemplateColumns: 'repeat(7, minmax(320px, 1fr))' }}>
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
              onQuickAdd={() => onQuickAdd(dateKey)}
            />
          )
          })}
        </div>
      </div>
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
  onQuickAdd,
}: DayColumnProps) {
  const { setNodeRef } = useSortable({ id: dateKey })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 p-4 backdrop-blur-xs ${
        today ? 'border-primary/50 bg-primary/10' : 'border-border/50 bg-card/50'
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
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>

      {tasks.length === 0 && (
        <p className="text-center text-xs text-muted-foreground/60 mb-3 py-4">
          {today ? 'No tasks today' : 'No tasks'}
        </p>
      )}

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs font-medium border-dashed border-primary/30 hover:border-primary/50"
        onClick={onQuickAdd}
      >
        <PlusIcon size={14} className="mr-1" /> Add task
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
}: {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
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
        size="sm"
        dragHandle={dragHandle}
      />
    </div>
  )
}
