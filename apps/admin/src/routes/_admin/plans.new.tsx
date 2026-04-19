import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { PlanForm } from '@/features/plans/plan-form'
import { useCreatePlan } from '@/features/plans/queries'
import { Button } from '@repo/ui'
import { ArrowLeft } from 'lucide-react'

function NewPlanPage() {
  const navigate = useNavigate()
  const create = useCreatePlan()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/plans">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Plan</h1>
          <p className="text-muted-foreground">Define price, limits, and features for a new plan.</p>
        </div>
      </div>

      <PlanForm
        submitLabel="Create Plan"
        submitting={create.isPending}
        error={
          create.isError
            ? (create.error as any)?.response?.data?.error ||
              (create.error as Error)?.message
            : null
        }
        onSubmit={(input) => {
          create.mutate(input, {
            onSuccess: (plan) => navigate({ to: '/plans/$planId', params: { planId: plan.id } }),
          })
        }}
      />
    </div>
  )
}

export const Route = createFileRoute('/_admin/plans/new')({
  component: NewPlanPage,
})
