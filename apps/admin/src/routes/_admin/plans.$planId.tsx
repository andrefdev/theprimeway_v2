import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { PlanForm } from '@/features/plans/plan-form'
import { usePlan, useUpdatePlan, useDeletePlan } from '@/features/plans/queries'
import { Badge, Button, Skeleton } from '@repo/ui'
import { ArrowLeft } from 'lucide-react'

function EditPlanPage() {
  const { planId } = Route.useParams()
  const navigate = useNavigate()
  const { data: plan, isLoading } = usePlan(planId)
  const update = useUpdatePlan(planId)
  const del = useDeletePlan()

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-muted-foreground">Plan not found.</p>
        <Link to="/plans">
          <Button variant="outline">Back to plans</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/plans">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{plan.displayName}</h1>
              {plan.name === 'free' && <Badge variant="primary">System</Badge>}
            </div>
            <p className="font-mono text-sm text-muted-foreground">{plan.id}</p>
          </div>
        </div>
        {plan.name !== 'free' && (
          <Button
            variant="outline"
            onClick={() => {
              const hard = !plan.isActive
              const msg = hard
                ? `Permanently delete "${plan.displayName}"? Cannot be undone.`
                : `Deactivate "${plan.displayName}"? Hidden from checkout; existing subscribers unaffected.`
              if (confirm(msg)) {
                del.mutate(
                  { id: plan.id, hard },
                  { onSuccess: () => navigate({ to: '/plans' }) },
                )
              }
            }}
            disabled={del.isPending}
          >
            {plan.isActive ? 'Deactivate' : 'Delete'}
          </Button>
        )}
      </div>

      <PlanForm
        plan={plan}
        submitLabel="Save Changes"
        submitting={update.isPending}
        error={
          update.isError
            ? (update.error as any)?.response?.data?.error ||
              (update.error as Error)?.message
            : null
        }
        onSubmit={(input) => update.mutate(input)}
      />
    </div>
  )
}

export const Route = createFileRoute('/_admin/plans/$planId')({
  component: EditPlanPage,
})
