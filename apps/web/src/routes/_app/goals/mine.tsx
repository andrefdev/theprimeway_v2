import { createFileRoute } from '@tanstack/react-router'
import { MyGoalsView } from '@/features/goals/components/MyGoalsView'

export const Route = createFileRoute('/_app/goals/mine')({
  component: MyGoalsView,
})
