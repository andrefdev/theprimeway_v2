import { createFileRoute } from '@tanstack/react-router'
import { TasksToday } from '@/features/tasks/components/TasksToday'

export const Route = createFileRoute('/_app/tasks/today')({
  component: TasksToday,
})
