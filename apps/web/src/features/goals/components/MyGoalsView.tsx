import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  goalsQueries,
  useDeleteThreeYearGoal,
  useDeleteAnnualGoal,
  useDeleteQuarterlyGoal,
  useUpdateAnnualGoal,
  useUpdateQuarterlyGoal,
} from '@/features/goals/queries'
import { GoalDialog } from './GoalDialog'
import { GoalsNav } from './GoalsNav'
import { InactiveGoalsAlert } from './InactiveGoalsAlert'
import { GoalConflictsPanel } from './GoalConflictsPanel'
import { GoalTemplatePicker } from './GoalTemplatePicker'
import { QueryError } from '@/shared/components/QueryError'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'
import { PlusIcon } from '@/shared/components/Icons'
import { EditButton, DeleteButton } from '@/shared/components/ActionButtons'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Progress } from '@/shared/components/ui/progress'
import { SectionHeader } from '@/shared/components/SectionHeader'
import type { PrimeVision, ThreeYearGoal, AnnualGoal, QuarterlyGoal } from '@repo/shared/types'
import { LEVEL_BADGE, toArray, type LevelFilter, type UnifiedGoal } from './goals-shared'

export function MyGoalsView() {
  const { t } = useTranslation('goals')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<UnifiedGoal | null>(null)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)

  return (
    <div>
      <GoalsNav />
      <SectionHeader sectionId="goals" title={t('tabMyGoals')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <InactiveGoalsAlert />
        <GoalConflictsPanel />
        <GoalsList
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          onNew={() => { setEditingGoal(null); setDialogOpen(true) }}
          onEdit={(g) => { setEditingGoal(g); setDialogOpen(true) }}
          onTemplates={() => setTemplatePickerOpen(true)}
        />
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

function GoalsList({
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
