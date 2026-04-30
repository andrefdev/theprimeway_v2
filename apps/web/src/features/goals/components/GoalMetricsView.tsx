import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { goalsQueries } from '@/features/goals/queries'
import { GoalsNav } from './GoalsNav'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { SectionHeader } from '@/shared/components/SectionHeader'
import type { ThreeYearGoal, AnnualGoal, QuarterlyGoal, WeeklyGoal } from '@repo/shared/types'
import { toArray } from './goals-shared'

export function GoalMetricsView() {
  const { t } = useTranslation('goals')

  const threeYearQuery = useQuery(goalsQueries.threeYearGoals())
  const annualQuery = useQuery(goalsQueries.annualGoals())
  const quarterlyQuery = useQuery(goalsQueries.quarterlyGoals())
  const weeklyQuery = useQuery(goalsQueries.weeklyGoals())

  const isLoading = threeYearQuery.isLoading || annualQuery.isLoading || quarterlyQuery.isLoading || weeklyQuery.isLoading

  const threeYear = useMemo(() => toArray<ThreeYearGoal>(threeYearQuery.data), [threeYearQuery.data])
  const annual = useMemo(() => toArray<AnnualGoal>(annualQuery.data), [annualQuery.data])
  const quarterly = useMemo(() => toArray<QuarterlyGoal>(quarterlyQuery.data), [quarterlyQuery.data])
  const weekly = useMemo(() => toArray<WeeklyGoal>(weeklyQuery.data), [weeklyQuery.data])

  const metrics = useMemo(() => {
    const activeThreeYear = threeYear.filter((g) => !isArchived(g))
    const archivedThreeYear = threeYear.filter(isArchived)
    const activeAnnual = annual.filter((g) => !isArchived(g))
    const archivedAnnual = annual.filter(isArchived)
    const activeQuarterly = quarterly.filter((g) => !isArchived(g))
    const archivedQuarterly = quarterly.filter(isArchived)

    const annualCompletion = avg(activeAnnual.map((g) => (g as any).progress ?? 0))
    const quarterlyCompletion = avg(activeQuarterly.map((g) => (g as any).progress ?? 0))
    const threeYearCompletion = percent(activeThreeYear.filter(isCompleted).length, activeThreeYear.length)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1
    const currentQuarterGoals = quarterly.filter(
      (g) => g.year === currentYear && g.quarter === currentQuarter && !isArchived(g),
    )
    const currentQuarterProgress = avg(currentQuarterGoals.map((g) => (g as any).progress ?? 0))

    return {
      activeThreeYear,
      archivedThreeYear,
      activeAnnual,
      archivedAnnual,
      activeQuarterly,
      archivedQuarterly,
      annualCompletion,
      quarterlyCompletion,
      threeYearCompletion,
      currentYear,
      currentQuarter,
      currentQuarterGoals,
      currentQuarterProgress,
    }
  }, [threeYear, annual, quarterly])

  const {
    activeThreeYear,
    archivedThreeYear,
    activeAnnual,
    archivedAnnual,
    activeQuarterly,
    archivedQuarterly,
    annualCompletion,
    quarterlyCompletion,
    threeYearCompletion,
    currentYear,
    currentQuarter,
    currentQuarterGoals,
    currentQuarterProgress,
  } = metrics

  const weeklyStreak = useMemo(() => computeWeeklyStreak(weekly), [weekly])

  if (isLoading) {
    return (
      <div>
        <GoalsNav />
        <SectionHeader sectionId="goals" title={t('title')} />
        <div className="mx-auto max-w-5xl px-6 pb-6">
          <SkeletonList lines={6} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <GoalsNav />
      <SectionHeader sectionId="goals" title={t('title')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label={t('tabRoadmap')} value={`${activeThreeYear.length}`} sub={`${archivedThreeYear.length} ${t('archived', { ns: 'common', defaultValue: 'archived' })}`} />
          <MetricCard label={t('createAnnualGoal')} value={`${activeAnnual.length}`} sub={`${archivedAnnual.length} ${t('archived', { ns: 'common', defaultValue: 'archived' })}`} />
          <MetricCard label={t('createQuarterlyGoal')} value={`${activeQuarterly.length}`} sub={`${archivedQuarterly.length} ${t('archived', { ns: 'common', defaultValue: 'archived' })}`} />
          <MetricCard label={t('tabWeekly')} value={`${weekly.length}`} sub={`${weeklyStreak} wk streak`} />
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">{t('progress')} · {t('tabRoadmap')}</h3>
            <ProgressRow label={t('createThreeYearGoal')} value={threeYearCompletion} />
            <ProgressRow label={t('createAnnualGoal')} value={annualCompletion} />
            <ProgressRow label={t('createQuarterlyGoal')} value={quarterlyCompletion} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{`${currentYear} · Q${currentQuarter}`}</h3>
              <span className="text-xs text-muted-foreground">{currentQuarterGoals.length} {t('createQuarterlyGoal').toLowerCase()}</span>
            </div>
            <ProgressRow label={t('progress')} value={currentQuarterProgress} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <Progress value={value} />
    </div>
  )
}

const isArchived = (g: any) => g.status === 'archived' || g.archived === true
const isCompleted = (g: any) =>
  g.status === 'completed' || (typeof g.progress === 'number' && g.progress >= 100)

function avg(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function percent(n: number, d: number): number {
  if (d === 0) return 0
  return (n / d) * 100
}

function computeWeeklyStreak(weekly: WeeklyGoal[]): number {
  if (weekly.length === 0) return 0
  const byWeek = new Map<string, WeeklyGoal[]>()
  for (const g of weekly) {
    const key = (g as any).weekStart ?? (g as any).week_start
    if (!key) continue
    const arr = byWeek.get(key) ?? []
    arr.push(g)
    byWeek.set(key, arr)
  }
  const weeks = [...byWeek.keys()].sort((a, b) => (a < b ? 1 : -1))
  let streak = 0
  for (const wk of weeks) {
    const goals = byWeek.get(wk)!
    const allDone = goals.every((g) => (g as any).status === 'completed' || (typeof (g as any).progress === 'number' && (g as any).progress >= 100))
    if (allDone) streak++
    else break
  }
  return streak
}
