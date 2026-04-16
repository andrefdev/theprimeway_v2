import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  goalsQueries,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateVision,
  useCreateThreeYearGoal,
} from '@/features/goals/queries'
import { QuarterlyGoals } from '@/features/goals/components/QuarterlyGoals'
import { WeeklyGoalsList } from '@/features/goals/components/WeeklyGoals'
import { JourneyView } from '@/features/goals/components/JourneyView'
import { GoalTreeView } from '@/features/goals/components/GoalTreeView'
import { InactiveGoalsAlert } from '@/features/goals/components/InactiveGoalsAlert'
import { GoalConflictsPanel } from '@/features/goals/components/GoalConflictsPanel'
import { GoalTemplatePicker } from '@/features/goals/components/GoalTemplatePicker'
import { QueryError } from '@/shared/components/QueryError'
import { PlusIcon, TargetIcon } from '@/shared/components/Icons'
import { EditButton, DeleteButton } from '@/shared/components/ActionButtons'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Progress } from '@/shared/components/ui/progress'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/shared/components/ui/dialog'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Goal, PrimeVision } from '@repo/shared/types'

export const Route = createFileRoute('/_app/goals')({
  component: GoalsPage,
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'in-progress': 'default',
  'completed': 'secondary',
  'paused': 'outline',
  'not-started': 'outline',
}

type Tab = 'goals' | 'roadmap' | 'tree' | 'quarterly' | 'weekly' | 'journey'

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function GoalsPage() {
  const { t } = useTranslation('goals')
  const [tab, setTab] = useState<Tab>('goals')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'goals', label: t('tabMyGoals') },
    { key: 'roadmap', label: t('tabRoadmap') },
    { key: 'tree', label: t('tabTree') },
    { key: 'quarterly', label: t('tabQuarterly') },
    { key: 'weekly', label: t('tabWeekly') },
    { key: 'journey', label: t('tabJourney') },
  ]

  return (
    <div>
      <SectionHeader sectionId="goals" title={t('pageTitle')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {/* AI Alerts */}
        <InactiveGoalsAlert />
        <GoalConflictsPanel />

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto border-b border-border -mx-6 px-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'goals' && (
          <GoalsTab
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onNew={() => { setEditingGoal(null); setDialogOpen(true) }}
            onEdit={(g) => { setEditingGoal(g); setDialogOpen(true) }}
            onTemplates={() => setTemplatePickerOpen(true)}
          />
        )}

        {tab === 'roadmap' && <RoadmapTab />}
        {tab === 'tree' && <GoalTreeView />}
        {tab === 'quarterly' && <QuarterlyGoals />}
        {tab === 'weekly' && <WeeklyGoalsList />}
        {tab === 'journey' && <JourneyView />}

        <GoalDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          goal={editingGoal}
        />

        <GoalTemplatePicker
          open={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
          onSelectTemplate={(_tmpl) => {
            setTemplatePickerOpen(false)
            toast.success(t('goalCreated'))
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Goals tab
// ---------------------------------------------------------------------------
function GoalsTab({
  statusFilter,
  setStatusFilter,
  onNew,
  onEdit,
  onTemplates,
}: {
  statusFilter: string
  setStatusFilter: (v: string) => void
  onNew: () => void
  onEdit: (g: Goal) => void
  onTemplates?: () => void
}) {
  const { t } = useTranslation('goals')
  const params = statusFilter !== 'all' ? { status: statusFilter } : undefined
  const goalsQuery = useQuery(goalsQueries.list(params))
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  const STATUS_OPTIONS = [
    { value: 'all', label: t('allStatuses', { ns: 'tasks' }) },
    { value: 'in-progress', label: t('statusInProgress') },
    { value: 'completed', label: t('completed', { ns: 'common' }) },
    { value: 'paused', label: t('statusPaused') },
  ]

  const goals = goalsQuery.data?.data ?? []

  async function handleDelete(goal: Goal) {
    try {
      await deleteGoal.mutateAsync(goal.id)
      toast.success(t('goalDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  async function handleProgressChange(goal: Goal, progress: number) {
    try {
      const status = progress >= 100 ? 'completed' : 'in-progress'
      await updateGoal.mutateAsync({ id: goal.id, data: { progress, status } })
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="max-w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {onTemplates && (
            <Button variant="outline" onClick={onTemplates}>
              {t('goalTemplates', { ns: 'common', defaultValue: 'Templates' })}
            </Button>
          )}
          <Button onClick={onNew}>
            <PlusIcon /> {t('newGoal')}
          </Button>
        </div>
      </div>

      {goalsQuery.isLoading && <SkeletonList lines={4} />}
      {goalsQuery.isError && <QueryError message={t('failedToLoad', { ns: 'common' })} onRetry={() => goalsQuery.refetch()} />}

      {!goalsQuery.isLoading && !goalsQuery.isError && goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((goal: Goal) => (
            <Card key={goal.id} className="group transition-colors hover:bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{goal.title}</h4>
                      <Badge variant={STATUS_COLORS[goal.status] || 'outline'} className="text-[10px]">
                        {goal.status}
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
                    )}
                    {goal.deadline && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {t('duePrefix')} {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <EditButton onClick={() => onEdit(goal)} />
                    <DeleteButton onClick={() => handleDelete(goal)} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{t('progress')}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={goal.progress} className="flex-1" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={goal.progress}
                      onChange={(e) => handleProgressChange(goal, Number(e.target.value))}
                      className="h-2 w-20 cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!goalsQuery.isLoading && !goalsQuery.isError && goals.length === 0 && (
        <EmptyState title={t('noGoalsYet')} description={t('noGoalsDescription')} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Prime Roadmap tab (enhanced with outcome creation)
// ---------------------------------------------------------------------------
function RoadmapTab() {
  const { t } = useTranslation('goals')
  const visionsQuery = useQuery(goalsQueries.visions())
  const threeYearGoalsQuery = useQuery(goalsQueries.threeYearGoals())
  const annualGoalsQuery = useQuery(goalsQueries.annualGoals())
  const createVision = useCreateVision()
  const createThreeYearGoal = useCreateThreeYearGoal()

  const visions = (visionsQuery.data?.data ?? []) as PrimeVision[]
  const threeYearGoals = (threeYearGoalsQuery.data?.data ?? []) as any[]
  const annualGoals = annualGoalsQuery.data?.data ?? []

  const isLoading = visionsQuery.isLoading || threeYearGoalsQuery.isLoading
  const isError = visionsQuery.isError || threeYearGoalsQuery.isError

  const [showVisionForm, setShowVisionForm] = useState(false)
  const [newVisionTitle, setNewVisionTitle] = useState('')
  const [pillarDialog, setPillarDialog] = useState<{ visionId: string } | null>(null)
  const [pillarTitle, setPillarTitle] = useState('')
  const [pillarArea, setPillarArea] = useState('general')

  async function handleCreateVision(e: React.FormEvent) {
    e.preventDefault()
    if (!newVisionTitle.trim()) return
    try {
      await createVision.mutateAsync({ title: newVisionTitle.trim() })
      toast.success(t('visionCreated'))
      setNewVisionTitle('')
      setShowVisionForm(false)
    } catch {
      toast.error(t('failedToCreateVision'))
    }
  }

  async function handleCreateThreeYearGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!pillarTitle.trim() || !pillarDialog) return
    try {
      await createThreeYearGoal.mutateAsync({
        visionId: pillarDialog.visionId,
        area: pillarArea,
        title: pillarTitle.trim(),
      })
      toast.success(t('threeYearGoalCreated'))
      setPillarTitle('')
      setPillarDialog(null)
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('roadmapTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('roadmapSubtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => setShowVisionForm(true)}>
          {t('addVision')}
        </Button>
      </div>

      {showVisionForm && (
        <form onSubmit={handleCreateVision} className="flex gap-2">
          <Input
            autoFocus
            value={newVisionTitle}
            onChange={(e) => setNewVisionTitle(e.target.value)}
            placeholder={t('visionPlaceholder')}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Escape' && setShowVisionForm(false)}
          />
          <Button type="submit" disabled={createVision.isPending || !newVisionTitle.trim()}>
            {t('create', { ns: 'common' })}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowVisionForm(false)}>
            {t('cancel', { ns: 'common' })}
          </Button>
        </form>
      )}

      {isLoading && <SkeletonList lines={4} />}
      {isError && <QueryError message={t('failedToLoad')} />}

      {!isLoading && !isError && visions.length === 0 && (
        <EmptyState title={t('noVision')} description={t('noVisionDescription')} />
      )}

      {visions.map((vision) => {
        const visionThreeYearGoals = threeYearGoals.filter((tg) => tg.visionId === vision.id)

        return (
          <Card key={vision.id} className="overflow-hidden">
            <div className="border-b border-border bg-primary/5 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TargetIcon className="text-primary" />
                  <h4 className="text-sm font-bold text-foreground">{vision.title}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPillarDialog({ visionId: vision.id })}
                >
                  <PlusIcon size={12} /> {t('addThreeYearGoal')}
                </Button>
              </div>
              {vision.description && (
                <p className="mt-1 text-xs text-muted-foreground">{vision.description}</p>
              )}
            </div>

            <CardContent className="p-4">
              {visionThreeYearGoals.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{t('noThreeYearGoals')}</p>
              ) : (
                <div className="space-y-3">
                  {visionThreeYearGoals.map((threeYearGoal) => {
                    const goalAnnualGoals = annualGoals.filter((o: any) => o.threeYearGoalId === threeYearGoal.id)
                    return (
                      <div key={threeYearGoal.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{threeYearGoal.area ? t(`area${threeYearGoal.area.charAt(0).toUpperCase() + threeYearGoal.area.slice(1)}`) : t('areaGeneral')}</Badge>
                          <span className="text-sm font-medium text-foreground">{threeYearGoal.title}</span>
                        </div>
                        {threeYearGoal.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{threeYearGoal.description}</p>
                        )}
                        {goalAnnualGoals.length > 0 && (
                          <div className="mt-2 ml-4 space-y-1 border-l-2 border-muted pl-3">
                            {goalAnnualGoals.map((annualGoal: any) => (
                              <div key={annualGoal.id} className="flex items-center gap-2 text-xs">
                                <span className="text-foreground font-medium">{annualGoal.title}</span>
                                {annualGoal.progress !== undefined && (
                                  <Progress value={annualGoal.progress} className="flex-1 h-1 max-w-20" />
                                )}
                                {annualGoal.targetDate && (
                                  <span className="text-muted-foreground">
                                    {t('byPrefix')} {new Date(annualGoal.targetDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Create Three Year Goal Dialog */}
      <Dialog open={!!pillarDialog} onOpenChange={(v) => { if (!v) setPillarDialog(null) }}>
        <DialogContent>
          <form onSubmit={handleCreateThreeYearGoal}>
            <DialogHeader>
              <DialogTitle>{t('createThreeYearGoal')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>{t('threeYearGoalTitle')}</Label>
                <Input
                  value={pillarTitle}
                  onChange={(e) => setPillarTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('area')}</Label>
                <Select value={pillarArea} onValueChange={setPillarArea}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['general', 'finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle'].map((a) => (
                      <SelectItem key={a} value={a}>{t(`area${a.charAt(0).toUpperCase() + a.slice(1)}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPillarDialog(null)}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={!pillarTitle.trim() || createThreeYearGoal.isPending}>
                {t('create', { ns: 'common' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Create / Edit goal dialog
// ---------------------------------------------------------------------------
function GoalDialog({
  open,
  onClose,
  goal,
}: {
  open: boolean
  onClose: () => void
  goal: Goal | null
}) {
  const { t } = useTranslation('goals')
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const isEdit = !!goal

  const TYPE_OPTIONS = [
    { value: 'short-term', label: t('typeShort') },
    { value: 'medium-term', label: t('typeMedium') },
    { value: 'long-term', label: t('typeLong') },
  ]

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [type, setType] = useState('short-term')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description ?? '')
      setDeadline(goal.deadline?.split('T')[0] ?? '')
      setType((goal as any).type ?? 'short-term')
    } else {
      setTitle('')
      setDescription('')
      setDeadline('')
      setType('short-term')
    }
  }
  if (open !== prevOpen) setPrevOpen(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      type,
    }

    try {
      if (isEdit) {
        await updateGoal.mutateAsync({ id: goal.id, data: payload })
        toast.success(t('goalUpdated'))
      } else {
        await createGoal.mutateAsync(payload)
        toast.success(t('goalCreated'))
      }
      onClose()
    } catch {
      toast.error(isEdit ? t('failedToUpdate') : t('failedToCreate'))
    }
  }

  const isPending = createGoal.isPending || updateGoal.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>{t('inputTitle')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('inputTitlePlaceholder')}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('inputDescription')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('inputDescriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('selectType')}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('deadline')}</Label>
                <DatePicker
                  date={deadline ? new Date(deadline + 'T00:00:00') : undefined}
                  onDateChange={(d) => setDeadline(d ? d.toISOString().split('T')[0]! : '')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isEdit ? t('saveChanges') : t('createGoal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
