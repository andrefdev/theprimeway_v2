import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { goalsQueries, useUpdateWeeklyGoal, useDeleteWeeklyGoal, useCreateWeeklyGoal } from '../queries'
import type { WeeklyGoal } from '@repo/shared/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { localYmd } from '@repo/shared/utils'
import { useUserTimezone } from '@/features/settings/hooks/use-user-timezone'

function startOfISOWeekInTz(d: Date, tz: string): Date {
  const todayKey = localYmd(d, tz)
  const [y, m, day] = todayKey.split('-').map(Number)
  const local = new Date(y!, m! - 1, day!)
  const dow = local.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  local.setDate(local.getDate() + diff)
  return local
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatRange(start: Date, locale: string): string {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function WeeklyGoalsList() {
  const { t, i18n } = useTranslation('goals')
  const tz = useUserTimezone()
  const [weekStart, setWeekStart] = useState<Date>(() => startOfISOWeekInTz(new Date(), tz))
  const weekStartDate = ymd(weekStart)

  const { data, isLoading } = useQuery(goalsQueries.weeklyGoals({ weekStartDate }))
  const goals = (Array.isArray(data) ? data : []) as WeeklyGoal[]

  const create = useCreateWeeklyGoal()
  const update = useUpdateWeeklyGoal()
  const remove = useDeleteWeeklyGoal()

  const [newTitle, setNewTitle] = useState('')

  const isCurrentWeek = useMemo(() => {
    return ymd(startOfISOWeekInTz(new Date(), tz)) === weekStartDate
  }, [weekStartDate, tz])

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + deltaDays)
    setWeekStart(startOfISOWeekInTz(d, tz))
  }

  async function handleCreate() {
    const title = newTitle.trim()
    if (!title) return
    try {
      await create.mutateAsync({ weekStartDate, title })
      setNewTitle('')
      toast.success(t('weeklyGoalCreated'))
    } catch {
      toast.error(t('failedToCreate', { ns: 'common', defaultValue: 'Failed to create' }))
    }
  }

  async function handleToggle(goal: WeeklyGoal) {
    const nextStatus = goal.status === 'completed' ? 'planned' : 'completed'
    try {
      await update.mutateAsync({ id: goal.id, data: { status: nextStatus } })
    } catch {
      toast.error(t('failedToUpdate', { ns: 'common', defaultValue: 'Failed to update' }))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDelete', { ns: 'common', defaultValue: 'Delete?' }))) return
    try {
      await remove.mutateAsync(id)
    } catch {
      toast.error(t('failedToDelete', { ns: 'common', defaultValue: 'Failed to delete' }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weeklyGoals')}</CardTitle>
        <CardDescription>
          {t('weeklyGoalsHint', {
            defaultValue: 'Set 3–5 objectives that move bigger goals forward this week. Auto-created from the Weekly Plan ritual.',
          })}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftWeek(-7)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium tabular-nums px-2 min-w-[8rem] text-center">
              {formatRange(weekStart, i18n.language)}
              {isCurrentWeek && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                  {t('thisWeek', { defaultValue: 'this week' })}
                </Badge>
              )}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftWeek(7)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <SkeletonList lines={3} />}

        {!isLoading && goals.length === 0 && (
          <div className="space-y-3">
            <EmptyState
              title={t('noWeeklyGoals')}
              description={t('noWeeklyGoalsDescription')}
            />
            <div className="text-center text-xs text-muted-foreground">
              <Link to={'/rituals/weekly-plan' as '/'} className="underline">
                {t('runWeeklyPlanRitual', { defaultValue: 'Run the Weekly Plan ritual' })}
              </Link>
            </div>
          </div>
        )}

        {!isLoading && goals.length > 0 && (
          <ul className="space-y-2">
            {goals.map((goal) => {
              const completed = goal.status === 'completed'
              return (
                <li key={goal.id} className="flex items-center gap-3 rounded-md border border-border/50 bg-card/40 px-3 py-2">
                  <Checkbox
                    checked={completed}
                    onCheckedChange={() => handleToggle(goal)}
                  />
                  <span className={`flex-1 text-sm ${completed ? 'text-muted-foreground line-through' : ''}`}>
                    {goal.title}
                  </span>
                  {goal.status && goal.status !== 'planned' && goal.status !== 'completed' && (
                    <Badge variant="outline" className="text-[10px]">{goal.status}</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Quick-add */}
        <div className="flex gap-2 pt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder={t('weeklyGoalPlaceholder')}
            className="h-9"
          />
          <Button onClick={handleCreate} disabled={!newTitle.trim() || create.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t('addGoal', { defaultValue: 'Add' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
