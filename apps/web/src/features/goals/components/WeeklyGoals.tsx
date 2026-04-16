import { useQuery } from '@tanstack/react-query'
import {
  goalsQueries,
  useCreateWeeklyGoal,
  useUpdateWeeklyGoal,
  useDeleteWeeklyGoal,
} from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { PlusIcon } from '@/shared/components/Icons'
import { DeleteButton } from '@/shared/components/ActionButtons'
import { toast } from 'sonner'
import { format, startOfWeek } from 'date-fns'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WeeklyGoal, WeeklyGoalStatus } from '@repo/shared/types'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  planned: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  canceled: 'destructive',
}

export function WeeklyGoalsList() {
  const { t } = useTranslation('goals')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weeklyQuery = useQuery(goalsQueries.weeklyGoals({ weekStartDate: weekStart }))
  const updateWeeklyGoal = useUpdateWeeklyGoal()
  const deleteWeeklyGoal = useDeleteWeeklyGoal()

  const [createOpen, setCreateOpen] = useState(false)

  const goals = (weeklyQuery.data?.data ?? []) as WeeklyGoal[]
  const completedCount = goals.filter((g) => g.status === 'completed').length

  async function handleStatusChange(goal: WeeklyGoal, status: WeeklyGoalStatus) {
    try {
      await updateWeeklyGoal.mutateAsync({ id: goal.id, data: { status } })
      toast.success(t('goalUpdated'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWeeklyGoal.mutateAsync(id)
      toast.success(t('goalDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  if (weeklyQuery.isLoading) return <SkeletonList lines={3} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('weeklyGoals')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('weekOf')} {weekStart} — {completedCount}/{goals.length} {t('completed', { ns: 'common' })}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon size={14} /> {t('addWeeklyGoal')}
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState title={t('noWeeklyGoals')} description={t('noWeeklyGoalsDescription')} />
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <Card key={goal.id} className="group transition-colors hover:bg-muted/30">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${
                      goal.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {goal.title}
                    </p>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{goal.description}</p>
                  )}
                </div>

                {/* Status selector */}
                <Select
                  value={goal.status}
                  onValueChange={(v) => handleStatusChange(goal, v as WeeklyGoalStatus)}
                >
                  <SelectTrigger className="w-[120px] h-7 text-[10px]">
                    <Badge variant={STATUS_COLORS[goal.status] ?? 'outline'} className="text-[9px]">
                      {goal.status === 'planned' ? t('statusPlanned') : goal.status === 'in_progress' ? t('statusInProgress') : goal.status === 'completed' ? t('statusCompleted') : t('statusCanceled')}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {(['planned', 'in_progress', 'completed', 'canceled'] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === 'planned' ? t('statusPlanned') : s === 'in_progress' ? t('statusInProgress') : s === 'completed' ? t('statusCompleted') : t('statusCanceled')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DeleteButton onClick={() => handleDelete(goal.id)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateWeeklyGoalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        weekStart={weekStart}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Weekly Goal Dialog
// ---------------------------------------------------------------------------
function CreateWeeklyGoalDialog({
  open,
  onClose,
  weekStart,
}: {
  open: boolean
  onClose: () => void
  weekStart: string
}) {
  const { t } = useTranslation('goals')
  const createWeeklyGoal = useCreateWeeklyGoal()
  const [title, setTitle] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createWeeklyGoal.mutateAsync({
        weekStartDate: weekStart,
        title: title.trim(),
      })
      toast.success(t('weeklyGoalCreated'))
      setTitle('')
      onClose()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('createWeeklyGoal')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>{t('goalTitle')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('weeklyGoalPlaceholder')}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!title.trim() || createWeeklyGoal.isPending}>
              {t('create', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
