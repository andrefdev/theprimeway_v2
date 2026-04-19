import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  goalsQueries,
  useCreateVision,
  useUpdateVision,
  useCreateThreeYearGoal,
  useUpdateThreeYearGoal,
  useDeleteThreeYearGoal,
  useCreateAnnualGoal,
  useUpdateAnnualGoal,
  useDeleteAnnualGoal,
  useCreateQuarterlyGoal,
  useUpdateQuarterlyGoal,
  useDeleteQuarterlyGoal,
} from '@/features/goals/queries'
import { QuarterlyGoals } from '@/features/goals/components/QuarterlyGoals'
import { WeeklyGoalsList } from '@/features/goals/components/WeeklyGoals'
import { JourneyView } from '@/features/goals/components/JourneyView'
import { GoalTreeView } from '@/features/goals/components/GoalTreeView'
import { InactiveGoalsAlert } from '@/features/goals/components/InactiveGoalsAlert'
import { GoalConflictsPanel } from '@/features/goals/components/GoalConflictsPanel'
import { GoalTemplatePicker } from '@/features/goals/components/GoalTemplatePicker'
import { QuarterlyReviewCard } from '@/features/goals/components/QuarterlyReviewCard'
import { QueryError } from '@/shared/components/QueryError'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'
import { PlusIcon, TargetIcon, EditIcon } from '@/shared/components/Icons'
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
import { SectionTabsLocal } from '@/shared/components/SectionTabsLocal'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PrimeVision, ThreeYearGoal, AnnualGoal, QuarterlyGoal } from '@repo/shared/types'

export const Route = createFileRoute('/_app/goals')({
  component: GoalsPage,
})

type Tab = 'goals' | 'roadmap' | 'tree' | 'quarterly' | 'weekly' | 'journey'
type GoalLevel = 'three-year' | 'annual' | 'quarterly'
type LevelFilter = GoalLevel | 'all'

type UnifiedGoal =
  | { level: 'three-year'; data: ThreeYearGoal }
  | { level: 'annual'; data: AnnualGoal }
  | { level: 'quarterly'; data: QuarterlyGoal }

const AREAS = ['general', 'finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle']

const LEVEL_BADGE: Record<GoalLevel, 'default' | 'secondary' | 'outline'> = {
  'three-year': 'default',
  annual: 'secondary',
  quarterly: 'outline',
}

function toArray<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[]
  return ((d as any)?.data ?? []) as T[]
}

function GoalsPage() {
  const { t } = useTranslation('goals')
  const [tab, setTab] = useState<Tab>('goals')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<UnifiedGoal | null>(null)
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
      <SectionTabsLocal value={tab} onChange={setTab} items={TABS.map(({ key, label }) => ({ key, label }))} />
      <SectionHeader sectionId="goals" title={t('pageTitle')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <InactiveGoalsAlert />
        <GoalConflictsPanel />

        {tab === 'goals' && (
          <GoalsTab
            levelFilter={levelFilter}
            setLevelFilter={setLevelFilter}
            onNew={() => { setEditingGoal(null); setDialogOpen(true) }}
            onEdit={(g) => { setEditingGoal(g); setDialogOpen(true) }}
            onTemplates={() => setTemplatePickerOpen(true)}
          />
        )}

        {tab === 'roadmap' && <RoadmapTab />}
        {tab === 'tree' && <GoalTreeView />}
        {tab === 'quarterly' && (
          <>
            <QuarterlyReviewCard />
            <QuarterlyGoals />
          </>
        )}
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

function GoalsTab({
  levelFilter,
  setLevelFilter,
  onNew,
  onEdit,
  onTemplates,
}: {
  levelFilter: LevelFilter
  setLevelFilter: (v: LevelFilter) => void
  onNew: () => void
  onEdit: (g: UnifiedGoal) => void
  onTemplates?: () => void
}) {
  const { t } = useTranslation('goals')
  const { locale } = useLocale()
  const visionsQuery = useQuery(goalsQueries.visions())
  const threeYearQuery = useQuery(goalsQueries.threeYearGoals())
  const annualQuery = useQuery(goalsQueries.annualGoals())
  const quarterlyQuery = useQuery(goalsQueries.quarterlyGoals())

  const deleteThreeYear = useDeleteThreeYearGoal()
  const deleteAnnual = useDeleteAnnualGoal()
  const deleteQuarterly = useDeleteQuarterlyGoal()
  const updateAnnual = useUpdateAnnualGoal()
  const updateQuarterly = useUpdateQuarterlyGoal()

  const visions = toArray<PrimeVision>(visionsQuery.data)
  const threeYearGoals = toArray<ThreeYearGoal>(threeYearQuery.data)
  const annualGoals = toArray<AnnualGoal>(annualQuery.data)
  const quarterlyGoals = toArray<QuarterlyGoal>(quarterlyQuery.data)

  const isLoading =
    visionsQuery.isLoading || threeYearQuery.isLoading || annualQuery.isLoading || quarterlyQuery.isLoading
  const isError = threeYearQuery.isError || annualQuery.isError || quarterlyQuery.isError

  const visionById = new Map(visions.map((v) => [v.id, v]))
  const threeYearById = new Map(threeYearGoals.map((g) => [g.id, g]))
  const annualById = new Map(annualGoals.map((g) => [g.id, g]))

  const unified: UnifiedGoal[] = [
    ...threeYearGoals.map<UnifiedGoal>((data) => ({ level: 'three-year', data })),
    ...annualGoals.map<UnifiedGoal>((data) => ({ level: 'annual', data })),
    ...quarterlyGoals.map<UnifiedGoal>((data) => ({ level: 'quarterly', data })),
  ]

  const filtered = levelFilter === 'all' ? unified : unified.filter((g) => g.level === levelFilter)

  const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
    { value: 'all', label: t('allStatuses', { ns: 'tasks' }) },
    { value: 'three-year', label: t('tabRoadmap') },
    { value: 'annual', label: t('createAnnualGoal') },
    { value: 'quarterly', label: t('createQuarterlyGoal') },
  ]

  async function handleDelete(g: UnifiedGoal) {
    try {
      if (g.level === 'three-year') await deleteThreeYear.mutateAsync(g.data.id)
      else if (g.level === 'annual') await deleteAnnual.mutateAsync(g.data.id)
      else await deleteQuarterly.mutateAsync(g.data.id)
      toast.success(t('goalDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  async function handleProgressChange(g: UnifiedGoal, progress: number) {
    try {
      if (g.level === 'annual') {
        await updateAnnual.mutateAsync({ id: g.data.id, data: { progress } })
      } else if (g.level === 'quarterly') {
        await updateQuarterly.mutateAsync({ id: g.data.id, data: { progress } })
      }
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  function getTitle(g: UnifiedGoal): string {
    if (g.level === 'three-year') return (g.data as any).title ?? (g.data as any).name ?? ''
    return g.data.title
  }

  function getParentChain(g: UnifiedGoal): string | null {
    if (g.level === 'three-year') {
      const v = visionById.get(g.data.visionId)
      return v ? v.title : null
    }
    if (g.level === 'annual') {
      const ty = threeYearById.get(g.data.threeYearGoalId)
      const v = ty ? visionById.get(ty.visionId) : undefined
      return [v?.title, ty && (ty as any).title ? (ty as any).title : (ty as any)?.name].filter(Boolean).join(' › ') || null
    }
    const an = annualById.get(g.data.annualGoalId)
    const ty = an ? threeYearById.get(an.threeYearGoalId) : undefined
    const v = ty ? visionById.get(ty.visionId) : undefined
    return [v?.title, ty && ((ty as any).title ?? (ty as any).name), an?.title].filter(Boolean).join(' › ') || null
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LevelFilter)}>
          <SelectTrigger className="max-w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map((opt) => (
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

      {isLoading && <SkeletonList lines={4} />}
      {isError && <QueryError message={t('failedToLoad', { ns: 'common' })} onRetry={() => threeYearQuery.refetch()} />}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((g) => {
            const title = getTitle(g)
            const parent = getParentChain(g)
            const showProgress = g.level !== 'three-year'
            const progress = (g.data as any).progress ?? 0
            const levelLabel =
              g.level === 'three-year' ? t('tabRoadmap')
              : g.level === 'annual' ? t('createAnnualGoal')
              : t('createQuarterlyGoal')
            const area = g.level === 'three-year' ? (g.data as ThreeYearGoal).area : null
            const targetDate = g.level === 'annual' ? (g.data as AnnualGoal).targetDate : null
            const yearQ = g.level === 'quarterly'
              ? `${(g.data as QuarterlyGoal).year} · Q${(g.data as QuarterlyGoal).quarter}`
              : null

            return (
              <Card key={`${g.level}-${g.data.id}`} className="group transition-colors hover:bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={LEVEL_BADGE[g.level]} className="text-[10px]">{levelLabel}</Badge>
                        {area && (
                          <Badge variant="outline" className="text-[10px]">
                            {t(`area${area.charAt(0).toUpperCase() + area.slice(1)}`)}
                          </Badge>
                        )}
                        {yearQ && <Badge variant="outline" className="text-[10px]">{yearQ}</Badge>}
                        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                      </div>
                      {parent && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{parent}</p>
                      )}
                      {g.data.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{g.data.description}</p>
                      )}
                      {targetDate && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {t('duePrefix')} {formatDate(targetDate, locale)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <EditButton onClick={() => onEdit(g)} />
                      <DeleteButton onClick={() => handleDelete(g)} />
                    </div>
                  </div>
                  {showProgress && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{t('progress')}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={progress}
                          onChange={(e) => handleProgressChange(g, Number(e.target.value))}
                          className="h-2 w-20 cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState title={t('noGoalsYet')} description={t('noGoalsDescription')} />
      )}
    </>
  )
}

function RoadmapTab() {
  const { t } = useTranslation('goals')
  const { locale } = useLocale()
  const visionsQuery = useQuery(goalsQueries.visions())
  const threeYearGoalsQuery = useQuery(goalsQueries.threeYearGoals())
  const annualGoalsQuery = useQuery(goalsQueries.annualGoals())
  const createVision = useCreateVision()
  const updateVision = useUpdateVision()
  const createThreeYearGoal = useCreateThreeYearGoal()

  const visions = toArray<PrimeVision>(visionsQuery.data)
  const threeYearGoals = toArray<ThreeYearGoal>(threeYearGoalsQuery.data)
  const annualGoals = toArray<AnnualGoal>(annualGoalsQuery.data)

  const isLoading = visionsQuery.isLoading || threeYearGoalsQuery.isLoading
  const isError = visionsQuery.isError || threeYearGoalsQuery.isError

  const [showVisionForm, setShowVisionForm] = useState(false)
  const [newVisionTitle, setNewVisionTitle] = useState('')
  const [editingVision, setEditingVision] = useState<PrimeVision | null>(null)
  const [editVisionTitle, setEditVisionTitle] = useState('')
  const [editVisionNarrative, setEditVisionNarrative] = useState('')
  const [pillarDialog, setPillarDialog] = useState<{ visionId: string } | null>(null)
  const [pillarTitle, setPillarTitle] = useState('')
  const [pillarArea, setPillarArea] = useState('general')

  const hasVision = visions.length > 0

  async function handleCreateVision(e: React.FormEvent) {
    e.preventDefault()
    if (!newVisionTitle.trim() || hasVision) return
    try {
      await createVision.mutateAsync({ title: newVisionTitle.trim() })
      toast.success(t('visionCreated'))
      setNewVisionTitle('')
      setShowVisionForm(false)
    } catch {
      toast.error(t('failedToCreateVision'))
    }
  }

  function openEditVision(vision: PrimeVision) {
    setEditingVision(vision)
    setEditVisionTitle(vision.title)
    setEditVisionNarrative((vision as any).narrative ?? vision.description ?? '')
  }

  async function handleUpdateVision(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVision || !editVisionTitle.trim()) return
    try {
      await updateVision.mutateAsync({
        id: editingVision.id,
        data: {
          title: editVisionTitle.trim(),
          narrative: editVisionNarrative.trim(),
        },
      })
      toast.success(t('visionUpdated'))
      setEditingVision(null)
    } catch {
      toast.error(t('failedToUpdateVision'))
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
        {!hasVision && (
          <Button variant="outline" onClick={() => setShowVisionForm(true)}>
            {t('addVision')}
          </Button>
        )}
      </div>

      {showVisionForm && !hasVision && (
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => openEditVision(vision)}
                    aria-label={t('editVision')}
                  >
                    <EditIcon size={12} /> {t('editVision')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPillarDialog({ visionId: vision.id })}
                  >
                    <PlusIcon size={12} /> {t('addThreeYearGoal')}
                  </Button>
                </div>
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
                    const goalAnnualGoals = annualGoals.filter((o) => o.threeYearGoalId === threeYearGoal.id)
                    return (
                      <div key={threeYearGoal.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {threeYearGoal.area
                              ? t(`area${threeYearGoal.area.charAt(0).toUpperCase() + threeYearGoal.area.slice(1)}`)
                              : t('areaGeneral')}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">{(threeYearGoal as any).title ?? (threeYearGoal as any).name}</span>
                        </div>
                        {threeYearGoal.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{threeYearGoal.description}</p>
                        )}
                        {goalAnnualGoals.length > 0 && (
                          <div className="mt-2 ml-4 space-y-1 border-l-2 border-muted pl-3">
                            {goalAnnualGoals.map((annualGoal) => (
                              <div key={annualGoal.id} className="flex items-center gap-2 text-xs">
                                <span className="text-foreground font-medium">{annualGoal.title}</span>
                                {annualGoal.progress !== undefined && (
                                  <Progress value={annualGoal.progress} className="flex-1 h-1 max-w-20" />
                                )}
                                {annualGoal.targetDate && (
                                  <span className="text-muted-foreground">
                                    {t('byPrefix')} {formatDate(annualGoal.targetDate, locale)}
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
                    {AREAS.map((a) => (
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

      <Dialog open={!!editingVision} onOpenChange={(v) => { if (!v) setEditingVision(null) }}>
        <DialogContent>
          <form onSubmit={handleUpdateVision}>
            <DialogHeader>
              <DialogTitle>{t('editVision')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>{t('visionPlaceholder')}</Label>
                <Input
                  value={editVisionTitle}
                  onChange={(e) => setEditVisionTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('visionNarrativePlaceholder')}</Label>
                <Textarea
                  value={editVisionNarrative}
                  onChange={(e) => setEditVisionNarrative(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditingVision(null)}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={!editVisionTitle.trim() || updateVision.isPending}>
                {t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function GoalDialog({
  open,
  onClose,
  goal,
}: {
  open: boolean
  onClose: () => void
  goal: UnifiedGoal | null
}) {
  const { t } = useTranslation('goals')
  const isEdit = !!goal

  const visionsQuery = useQuery(goalsQueries.visions())
  const threeYearQuery = useQuery(goalsQueries.threeYearGoals())
  const annualQuery = useQuery(goalsQueries.annualGoals())

  const visions = toArray<PrimeVision>(visionsQuery.data)
  const threeYearGoals = toArray<ThreeYearGoal>(threeYearQuery.data)
  const annualGoals = toArray<AnnualGoal>(annualQuery.data)

  const createThreeYear = useCreateThreeYearGoal()
  const updateThreeYear = useUpdateThreeYearGoal()
  const createAnnual = useCreateAnnualGoal()
  const updateAnnual = useUpdateAnnualGoal()
  const createQuarterly = useCreateQuarterlyGoal()
  const updateQuarterly = useUpdateQuarterlyGoal()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1

  const [level, setLevel] = useState<GoalLevel>('three-year')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visionId, setVisionId] = useState('')
  const [area, setArea] = useState('general')
  const [threeYearGoalId, setThreeYearGoalId] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [annualGoalId, setAnnualGoalId] = useState('')
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState<number>(currentQuarter)

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    if (goal) {
      setLevel(goal.level)
      setDescription(goal.data.description ?? '')
      if (goal.level === 'three-year') {
        const d = goal.data
        setTitle((d as any).title ?? (d as any).name ?? '')
        setVisionId(d.visionId)
        setArea(d.area ?? 'general')
      } else if (goal.level === 'annual') {
        setTitle(goal.data.title)
        setThreeYearGoalId(goal.data.threeYearGoalId)
        setTargetDate(goal.data.targetDate?.split('T')[0] ?? '')
      } else {
        setTitle(goal.data.title)
        setAnnualGoalId(goal.data.annualGoalId)
        setYear(goal.data.year)
        setQuarter(goal.data.quarter)
      }
    } else {
      setLevel('three-year')
      setTitle('')
      setDescription('')
      setVisionId(visions[0]?.id ?? '')
      setArea('general')
      setThreeYearGoalId(threeYearGoals[0]?.id ?? '')
      setTargetDate('')
      setAnnualGoalId(annualGoals[0]?.id ?? '')
      setYear(currentYear)
      setQuarter(currentQuarter)
    }
  }
  if (open !== prevOpen) setPrevOpen(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      if (level === 'three-year') {
        if (!visionId) { toast.error(t('failedToCreate')); return }
        if (isEdit && goal?.level === 'three-year') {
          await updateThreeYear.mutateAsync({
            id: goal.data.id,
            data: { title: title.trim(), area, description: description.trim() || undefined } as any,
          })
        } else {
          await createThreeYear.mutateAsync({
            visionId,
            area,
            title: title.trim(),
            description: description.trim() || undefined,
          })
        }
      } else if (level === 'annual') {
        if (!threeYearGoalId) { toast.error(t('failedToCreate')); return }
        if (isEdit && goal?.level === 'annual') {
          await updateAnnual.mutateAsync({
            id: goal.data.id,
            data: {
              title: title.trim(),
              description: description.trim() || undefined,
              targetDate: targetDate || undefined,
            } as any,
          })
        } else {
          await createAnnual.mutateAsync({
            threeYearGoalId,
            title: title.trim(),
            description: description.trim() || undefined,
            targetDate: targetDate || undefined,
          })
        }
      } else {
        if (!annualGoalId) { toast.error(t('failedToCreate')); return }
        if (isEdit && goal?.level === 'quarterly') {
          await updateQuarterly.mutateAsync({
            id: goal.data.id,
            data: {
              title: title.trim(),
              description: description.trim() || undefined,
            } as any,
          })
        } else {
          await createQuarterly.mutateAsync({
            annualGoalId,
            year,
            quarter,
            title: title.trim(),
            description: description.trim() || undefined,
          })
        }
      }
      toast.success(isEdit ? t('goalUpdated') : t('goalCreated'))
      onClose()
    } catch {
      toast.error(isEdit ? t('failedToUpdate') : t('failedToCreate'))
    }
  }

  const isPending =
    createThreeYear.isPending || updateThreeYear.isPending ||
    createAnnual.isPending || updateAnnual.isPending ||
    createQuarterly.isPending || updateQuarterly.isPending

  const noVisions = visions.length === 0
  const noThreeYear = threeYearGoals.length === 0
  const noAnnual = annualGoals.length === 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>{t('selectType')}</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as GoalLevel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="three-year">{t('createThreeYearGoal')}</SelectItem>
                    <SelectItem value="annual">{t('createAnnualGoal')}</SelectItem>
                    <SelectItem value="quarterly">{t('createQuarterlyGoal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {level === 'three-year' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('addVision')}</Label>
                  <Select value={visionId} onValueChange={setVisionId} disabled={isEdit}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={noVisions ? t('noVision') : undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {visions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('area')}</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>{t(`area${a.charAt(0).toUpperCase() + a.slice(1)}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {level === 'annual' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('createThreeYearGoal')}</Label>
                  <Select value={threeYearGoalId} onValueChange={setThreeYearGoalId} disabled={isEdit}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={noThreeYear ? t('noThreeYearGoals') : undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {threeYearGoals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{(g as any).title ?? (g as any).name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('deadline')}</Label>
                  <DatePicker
                    date={targetDate ? new Date(targetDate + 'T00:00:00') : undefined}
                    onDateChange={(d) => setTargetDate(d ? d.toISOString().split('T')[0]! : '')}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {level === 'quarterly' && (
              <>
                <div className="space-y-1.5">
                  <Label>{t('createAnnualGoal')}</Label>
                  <Select value={annualGoalId} onValueChange={setAnnualGoalId} disabled={isEdit}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={noAnnual ? t('noAnnualGoals') : undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {annualGoals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      disabled={isEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('quarter')}</Label>
                    <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))} disabled={isEdit}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((q) => (
                          <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
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
