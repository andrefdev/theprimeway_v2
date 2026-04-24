import { createFileRoute } from '@tanstack/react-router'
import { RecurringManager } from '@/features/recurring/components/RecurringManager'

export const Route = createFileRoute('/_app/recurring')({
  component: RecurringPage,
})

function RecurringPage() {
  return <RecurringManager />
}
