import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskItem } from '@/components/task-item'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/icons'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Task } from '@repo/shared/types'
import { useTranslation } from 'react-i18next'

interface DayPlannerProps {
  tasks: Task[]
  date: string
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onReorder: (taskId: string, newStart: string, newEnd: string) => void
  onQuickAdd: (hour: number) => void
  startHour?: number
  endHour?: number
}

const SLOT_HEIGHT = 64 // px per hour slot

export function DayPlanner({
  tasks,
  date,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onQuickAdd,
  startHour = 6,
  endHour = 22,
}: DayPlannerProps) {
  const { t } = useTranslation('tasks')
  const hours = useMemo(() => {
    const h: number[] = []
    for (let i = startHour; i <= endHour; i++) h.push(i)
    return h
  }, [startHour, endHour])

  // Split tasks: scheduled (have start/end times) vs unscheduled
  const { scheduled, unscheduled } = useMemo(() => {
    const sched: Task[] = []
    const unsched: Task[] = []
    for (const task of tasks) {
      if (task.scheduledStart && task.scheduledEnd) {
        sched.push(task)
      } else {
        unsched.push(task)
      }
    }
    return { scheduled: sched, unscheduled: unsched }
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      // Find the task and calculate new position
      const taskId = String(active.id)
      const overHour = Number(over.id)
      if (isNaN(overHour)) return

      const duration = (() => {
        const task = tasks.find((t) => t.id === taskId)
        return task?.estimatedDuration ?? 30
      })()

      const newStart = `${date}T${String(overHour).padStart(2, '0')}:00:00`
      const endMinutes = overHour * 60 + duration
      const endH = Math.floor(endMinutes / 60)
      const endM = endMinutes % 60
      const newEnd = `${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`

      onReorder(taskId, newStart, newEnd)
    },
    [date, tasks, onReorder],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            {t('unscheduled')} ({unscheduled.length})
          </h4>
          {unscheduled.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggle(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              size="sm"
            />
          ))}
        </div>
      )}

      {/* Time grid */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="relative">
            {hours.map((hour) => {
              const hourTasks = scheduled.filter((t) => {
                const taskHour = extractHour(t.scheduledStart!)
                return taskHour === hour
              })

              return (
                <HourSlot
                  key={hour}
                  hour={hour}
                  tasks={hourTasks}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onQuickAdd={() => onQuickAdd(hour)}
                />
              )
            })}
          </div>
        </DndContext>
      </ScrollArea>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hour slot row
// ---------------------------------------------------------------------------
interface HourSlotProps {
  hour: number
  tasks: Task[]
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onQuickAdd: () => void
}

function HourSlot({ hour, tasks, onToggle, onEdit, onDelete, onQuickAdd }: HourSlotProps) {
  const [hovered, setHovered] = useState(false)
  const timeLabel = `${String(hour).padStart(2, '0')}:00`

  return (
    <div
      className="flex gap-3 border-t border-border/50 group/slot"
      style={{ minHeight: SLOT_HEIGHT }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Time label */}
      <div className="w-14 flex-shrink-0 pt-1 text-right">
        <span className="text-[11px] text-muted-foreground">{timeLabel}</span>
      </div>

      {/* Task area */}
      <div className="flex-1 py-1 min-h-[40px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggle(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && hovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={onQuickAdd}
          >
            <PlusIcon size={12} />
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable task wrapper
// ---------------------------------------------------------------------------
function SortableTaskItem({
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
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
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

function extractHour(iso: string): number {
  const match = iso.match(/T(\d{2})/)
  return match ? Number(match[1]) : 0
}
