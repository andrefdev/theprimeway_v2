import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAmbassadorMe } from '@/features/ambassador/queries'
import { AmbassadorDashboard } from '@/features/ambassador/components/AmbassadorDashboard'
import { Skeleton } from '@/shared/components/ui/skeleton'

export const Route = createFileRoute('/_app/ambassador')({
  component: AmbassadorPage,
})

function AmbassadorPage() {
  const { data, isLoading } = useAmbassadorMe()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!data || data.status !== 'APPROVED') {
    return <Navigate to={'/settings' as const} search={{ tab: 'ambassador' } as any} />
  }

  return <AmbassadorDashboard />
}
