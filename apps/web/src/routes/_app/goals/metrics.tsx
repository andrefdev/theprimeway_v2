import { createFileRoute } from '@tanstack/react-router'
import { GoalMetricsView } from '@/features/goals/components/GoalMetricsView'

export const Route = createFileRoute('/_app/goals/metrics')({
  component: GoalMetricsView,
})
