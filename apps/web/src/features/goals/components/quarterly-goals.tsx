import { useQuery } from '@tanstack/react-query'
import { goalsQueries, useCreateQuarterlyGoal, useUpdateQuarterlyGoal, useDeleteQuarterlyGoal } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { PlusIcon } from '@/components/icons'
import { EditButton, DeleteButton } from '@/components/action-buttons'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { QuarterlyGoal, KeyResult } from '@repo/shared/types'

const CURRENT_QUARTER = Math.ceil((new Date().getMonth() + 1) / 3)
const CURRENT_YEAR = new Date().getFullYear()

export function QuarterlyGoals() {
  const { t } = useTranslation('goals')
  const goalsQuery = useQuery(goalsQueries.quarterlyGoals({ year: CURRENT_YEAR }))
  const deleteGoal = useDeleteQuarterlyGoal()

  const [createOpen, setCreateOpen] = useState(false)
  const [checkinGoal, setCheckinGoal] = useState<QuarterlyGoal | null>(null)

  const goals = (goalsQuery.data?.data ?? []) as QuarterlyGoal[]

  // Group by quarter
  const byQuarter = [1, 2, 3, 4].map((q) => ({
    quarter: q,
    goals: goals.filter((g) => g.quarter === q),
    isCurrent: q === CURRENT_QUARTER,
  }))

  async function handleDelete(id: string) {
    try {
      await deleteGoal.mutateAsync(id)
      toast.success(t('goalDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  if (goalsQuery.isLoading) return <SkeletonList lines={4} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('quarterlyGoals')}</h3>
          <p className="text-xs text-muted-foreground">{CURRENT_YEAR}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon size={14} /> {t('addGoal')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {byQuarter.map(({ quarter, goals: qGoals, isCurrent }) => (
          <div
            key={quarter}
            className={`rounded-lg border p-3 ${
              isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={isCurrent ? 'default' : 'outline'}>Q{quarter}</Badge>
              {isCurrent && <span className="text-[10px] text-primary font-medium">{t('current')}</span>}
            </div>

            {qGoals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{t('noGoals')}</p>
            ) : (
              <div className="space-y-2">
                {qGoals.map((goal) => (
                  <Card key={goal.id} className="group">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{goal.title}</p>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          <EditButton onClick={() => setCheckinGoal(goal)} />
                          <DeleteButton onClick={() => handleDelete(goal.id)} />
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{t('progress')}</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-1.5" />
                      </div>

                      {/* Key Results */}
                      {goal.objectives && goal.objectives.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {goal.objectives.map((kr, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground truncate flex-1">{kr.title}</span>
                              <span className="text-foreground font-medium ml-2">
                                {kr.current}/{kr.target} {kr.unit ?? ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Goal Dialog */}
      <CreateGoalDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Check-in Dialog */}
      {checkinGoal && (
        <CheckinDialog
          goal={checkinGoal}
          open={!!checkinGoal}
          onClose={() => setCheckinGoal(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Goal Dialog
// ---------------------------------------------------------------------------
function CreateGoalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('goals')
  const createGoal = useCreateQuarterlyGoal()
  const [title, setTitle] = useState('')
  const [quarter, setQuarter] = useState(CURRENT_QUARTER)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createGoal.mutateAsync({
        annualGoalId: '', // optional, can be linked later
        year: CURRENT_YEAR,
        quarter,
        title: title.trim(),
      })
      toast.success(t('goalCreated'))
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
            <DialogTitle>{t('createGoal')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>{t('goalTitle')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('goalTitlePlaceholder')}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('quarter')}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant={quarter === q ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuarter(q)}
                  >
                    Q{q}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!title.trim() || createGoal.isPending}>{t('create', { ns: 'common' })}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Check-in Dialog (update KR progress)
// ---------------------------------------------------------------------------
function CheckinDialog({ goal, open, onClose }: { goal: QuarterlyGoal; open: boolean; onClose: () => void }) {
  const { t } = useTranslation('goals')
  const updateGoal = useUpdateQuarterlyGoal()
  const [objectives, setObjectives] = useState<KeyResult[]>(goal.objectives ?? [])

  function updateKR(index: number, current: number) {
    setObjectives((prev) => prev.map((kr, i) => i === index ? { ...kr, current } : kr))
  }

  async function handleSave() {
    const avgProgress = objectives.length > 0
      ? Math.round(objectives.reduce((sum, kr) => sum + (kr.target > 0 ? (kr.current / kr.target) * 100 : 0), 0) / objectives.length)
      : goal.progress

    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: { objectives, progress: Math.min(avgProgress, 100) },
      })
      toast.success(t('progressUpdated'))
      onClose()
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('checkin')}: {goal.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {objectives.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noKeyResults')}</p>
          ) : (
            objectives.map((kr, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{kr.title}</Label>
                  <span className="text-xs text-muted-foreground">
                    {kr.current}/{kr.target} {kr.unit ?? ''}
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={kr.target}
                  value={String(kr.current)}
                  onChange={(e) => updateKR(i, Number(e.target.value) || 0)}
                />
                <Progress value={kr.target > 0 ? (kr.current / kr.target) * 100 : 0} className="h-1" />
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleSave} disabled={updateGoal.isPending}>{t('saveProgress')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
