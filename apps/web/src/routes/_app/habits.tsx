import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  habitsQueries,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
} from '@/features/habits/queries'
import { goalsQueries } from '@/features/goals/queries'
import { HabitTracker } from '@/features/habits/components/HabitTracker'
import { HabitsStats } from '@/features/habits/components/HabitsStats'
import { HabitsFilters } from '@/features/habits/components/HabitsFilters'
import { HabitDetailPanel } from '@/features/habits/components/HabitDetailPanel'
import { QueryError } from '@/shared/components/QueryError'
import { PlusIcon, CheckIcon } from '@/shared/components/Icons'
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
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/shared/components/ui/dialog'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/useLocale'
import type { Habit } from '@repo/shared/types'
import { LIFE_PILLARS, CATEGORY_TO_PILLAR } from '@repo/shared/constants'
import { StreakProtectionAlert } from '@/features/habits/components/StreakProtectionAlert'

export const Route = createFileRoute('/_app/habits')({
  component: HabitsPage,
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const COLOR_OPTIONS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16',
]

type Tab = 'tracker' | 'list' | 'stats'

// Helper: Get color with alpha (supports hex and CSS vars)
function getColorWithAlpha(color: string | null | undefined, alpha: string): string {
  const c = color || '#3b82f6'
  if (c.startsWith('var(')) {
    // CSS variable — use rgba with opacity instead
    return `rgba(59, 130, 246, ${parseInt(alpha, 16) / 255})`
  }
  // Hex color — append alpha digits
  return c + alpha
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function HabitsPage() {
  const { t } = useTranslation('habits')
  const { dateFnsLocale } = useLocale()
  const today = format(new Date(), 'yyyy-MM-dd')
  const habitsQuery = useQuery(habitsQueries.todayWithLogs(today))
  const toggleLog = useToggleHabitLog()
  const deleteHabit = useDeleteHabit()

  const [tab, setTab] = useState<Tab>('tracker')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const habits = habitsQuery.data?.data ?? []
  const totalHabits = habits.length
  const completedToday = habits.filter((h) => {
    const todayLog = h.logs?.find((l) => l.date.startsWith(today))
    return todayLog && todayLog.completedCount >= h.targetFrequency
  }).length

  // Client-side filter
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter) {
        const habitPillar = CATEGORY_TO_PILLAR[h.category ?? ''] || h.category
        if (habitPillar !== categoryFilter) return false
      }
      return true
    })
  }, [habits, search, categoryFilter])

  function openCreate() {
    setEditingHabit(null)
    setDialogOpen(true)
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit)
    setDialogOpen(true)
  }

  async function handleToggle(habit: Habit, date?: string) {
    const targetDate = date ?? today
    const log = habit.logs?.find((l) => l.date.startsWith(targetDate))
    const currentCount = log?.completedCount ?? 0
    const isComplete = currentCount >= habit.targetFrequency
    const newCount = isComplete ? 0 : Math.min(currentCount + 1, habit.targetFrequency)

    try {
      await toggleLog.mutateAsync({
        habitId: habit.id,
        data: { date: targetDate, completedCount: newCount },
      })
      if (newCount >= habit.targetFrequency) {
        toast.success(t('habitCompletedToast', { name: habit.name }))
      }
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleDelete(habit: Habit) {
    try {
      await deleteHabit.mutateAsync(habit.id)
      toast.success(t('habitDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  return (
    <div>
      <SectionHeader
        sectionId="habits"
        title={format(new Date(), 'EEEE, MMMM d', { locale: dateFnsLocale })}
        description={`${completedToday}/${totalHabits} ${t('completedToday')}`}
        actions={<Button onClick={openCreate}><PlusIcon /> {t('newHabit')}</Button>}
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {/* Streak Protection Alerts */}
        <StreakProtectionAlert />

        {/* Progress bar */}
        {totalHabits > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{t('todaysProgress')}</span>
              <span>{Math.round((completedToday / totalHabits) * 100)}%</span>
            </div>
            <Progress value={Math.round((completedToday / totalHabits) * 100)} />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-4 border-b border-border">
          {(['tracker', 'list', 'stats'] as const).map((t_) => (
            <button
              key={t_}
              type="button"
              onClick={() => setTab(t_)}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                tab === t_
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t_=== 'tracker' ? t('tabTracker') : t_ === 'list' ? t('tabList') : t('tabStats')}
            </button>
          ))}
        </div>

        {/* Loading / Error */}
        {habitsQuery.isLoading && <SkeletonList lines={5} />}
        {habitsQuery.isError && (
          <QueryError message={t('failedToLoad')} onRetry={() => habitsQuery.refetch()} />
        )}

        {/* Tab content */}
        {!habitsQuery.isLoading && !habitsQuery.isError && (
          <>
            {tab === 'tracker' && (
              <>
                {habits.length > 0 ? (
                  <HabitTracker
                    habits={filteredHabits}
                    onToggle={(h, date) => handleToggle(h, date)}
                    onEdit={openEdit}
                  />
                ) : (
                  <EmptyState title={t('noHabitsYet')} description={t('noHabitsDescription')} />
                )}
              </>
            )}

            {tab === 'list' && (
              <>
                <HabitsFilters
                  search={search}
                  onSearchChange={setSearch}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                />
                {filteredHabits.length > 0 ? (
                  <div className="space-y-2">
                    {filteredHabits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        today={today}
                        onToggle={() => handleToggle(habit)}
                        onEdit={() => openEdit(habit)}
                        onDelete={() => handleDelete(habit)}
                        onView={() => setSelectedHabit(habit)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title={t('noHabitsYet')} description={t('noHabitsDescription')} />
                )}
              </>
            )}

            {tab === 'stats' && <HabitsStats />}
          </>
        )}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selectedHabit} onOpenChange={(open) => { if (!open) setSelectedHabit(null) }}>
        <SheetContent side="right" className="w-full sm:w-[400px] overflow-hidden flex flex-col">
          {selectedHabit && (
            <HabitDetailPanel
              habit={selectedHabit}
              onClose={() => setSelectedHabit(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit dialog */}
      <HabitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        habit={editingHabit}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Habit card (list view)
// ---------------------------------------------------------------------------
function HabitCard({
  habit,
  today,
  onToggle,
  onEdit,
  onDelete,
  onView,
}: {
  habit: Habit
  today: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}) {
  const { t } = useTranslation('habits')
  const todayLog = habit.logs?.find((l) => l.date.startsWith(today))
  const completedCount = todayLog?.completedCount ?? 0
  const isComplete = completedCount >= habit.targetFrequency
  const progress = habit.targetFrequency > 0 ? Math.min(completedCount / habit.targetFrequency, 1) : 0

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:border-border hover:shadow-md" onClick={onView}>
      <CardContent className="p-0">
        <div className="flex items-stretch gap-0">
          {/* Left: Toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="flex shrink-0 items-center justify-center w-14 transition-colors"
            style={
              isComplete
                ? { backgroundColor: habit.color || '#3b82f6' }
                : { backgroundColor: getColorWithAlpha(habit.color, '15') }
            }
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                isComplete
                  ? 'border-white bg-white/20 text-white'
                  : 'border-white/30'
              }`}
            >
              {isComplete ? (
                <CheckIcon size={16} />
              ) : habit.targetFrequency > 1 ? (
                <span className="text-xs font-bold text-white">{completedCount}/{habit.targetFrequency}</span>
              ) : null}
            </div>
          </button>

          {/* Right: Info */}
          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className={`text-sm font-semibold leading-tight ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {habit.name}
                </p>
              </div>
              <div
                className="flex items-center gap-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <EditButton onClick={onEdit} />
                <DeleteButton onClick={onDelete} />
              </div>
            </div>

            {habit.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{habit.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {habit.category && (
                <Badge variant="secondary" className="text-[10px] py-0.5">{habit.category}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {habit.frequencyType === 'daily' && t('displayDaily')}
                {habit.frequencyType === 'week_days' && `${habit.weekDays.map((d) => DAY_LABELS[d]).join(', ')}`}
                {habit.frequencyType === 'times_per_week' && `${habit.targetFrequency}${t('displayPerWeek')}`}
              </span>
            </div>

            {/* Progress bar for multi-target habits */}
            {habit.targetFrequency > 1 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: habit.color || 'var(--color-primary)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Create / Edit dialog
// ---------------------------------------------------------------------------
function HabitDialog({
  open,
  onClose,
  habit,
}: {
  open: boolean
  onClose: () => void
  habit: Habit | null
}) {
  const { t } = useTranslation('habits')
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const threeYearGoalsQuery = useQuery(goalsQueries.threeYearGoals())
  const annualGoalsQuery = useQuery(goalsQueries.annualGoals())
  const quarterlyGoalsQuery = useQuery(goalsQueries.quarterlyGoals())

  const isEdit = !!habit

  const FREQUENCY_OPTIONS = [
    { value: 'daily', label: t('frequencyDaily') },
    { value: 'week_days', label: t('frequencyWeekDays') },
    { value: 'times_per_week', label: t('frequencyTimesPerWeek') },
  ]

  // Map pillar id to i18n key: health_body -> pillarHealthBody
  const pillarI18nKey = (id: string) =>
    'pillar' + id.split('_').map(w => w[0]!.toUpperCase() + w.slice(1)).join('')

  const CATEGORY_OPTIONS = [
    { value: 'none', label: t('categoryNone') },
    ...LIFE_PILLARS.map(p => ({
      value: p.id,
      label: t(pillarI18nKey(p.id) as any),
    })),
  ]

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('none')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [frequencyType, setFrequencyType] = useState<string>('daily')
  const [targetFrequency, setTargetFrequency] = useState(1)
  const [weekDays, setWeekDays] = useState<number[]>([])
  const [linkedGoalId, setLinkedGoalId] = useState<string | undefined>()

  // Reset form when dialog opens
  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    if (habit) {
      setName(habit.name)
      setDescription(habit.description ?? '')
      setCategory(CATEGORY_TO_PILLAR[habit.category ?? ''] || habit.category || 'none')
      setColor(habit.color ?? COLOR_OPTIONS[0])
      setFrequencyType(habit.frequencyType)
      setTargetFrequency(habit.targetFrequency)
      setWeekDays(habit.weekDays ?? [])
      setLinkedGoalId((habit as any).goalId)
    } else {
      setName('')
      setDescription('')
      setCategory('none')
      setColor(COLOR_OPTIONS[0])
      setFrequencyType('daily')
      setTargetFrequency(1)
      setWeekDays([])
      setLinkedGoalId(undefined)
    }
  }
  if (open !== prevOpen) setPrevOpen(open)

  function toggleDay(day: number) {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category !== 'none' ? category : undefined,
      color,
      frequencyType: frequencyType as 'daily' | 'week_days' | 'times_per_week',
      targetFrequency,
      weekDays: frequencyType === 'week_days' ? weekDays : undefined,
      ...(linkedGoalId ? { goalId: linkedGoalId } : {}),
    }

    try {
      if (isEdit) {
        await updateHabit.mutateAsync({ id: habit.id, data: payload })
        toast.success(t('habitUpdated'))
      } else {
        await createHabit.mutateAsync(payload)
        toast.success(t('habitCreated'))
      }
      onClose()
    } catch {
      toast.error(isEdit ? t('failedToUpdate') : t('failedToCreate'))
    }
  }

  const isPending = createHabit.isPending || updateHabit.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>{t('nameLabel')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('descriptionLabel')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('lifePillar')}</Label>
                <Select value={category || '__none__'} onValueChange={(v) => setCategory(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => {
                      const pillar = LIFE_PILLARS.find(p => p.id === opt.value)
                      return (
                        <SelectItem key={opt.value || '__none__'} value={opt.value || '__none__'}>
                          <span className="flex items-center gap-2">
                            {pillar && (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: pillar.color }}
                              />
                            )}
                            {opt.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t('frequency')}</Label>
                <Select value={frequencyType} onValueChange={setFrequencyType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Week days selector */}
            {frequencyType === 'week_days' && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{t('selectDays')}</p>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        weekDays.includes(idx)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target frequency */}
            {frequencyType === 'times_per_week' && (
              <div className="space-y-1.5">
                <Label>{t('timesPerWeek')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={String(targetFrequency)}
                  onChange={(e) => setTargetFrequency(Number(e.target.value) || 1)}
                />
              </div>
            )}

            {frequencyType === 'daily' && (
              <div className="space-y-1.5">
                <Label>{t('dailyTarget')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={String(targetFrequency)}
                  onChange={(e) => setTargetFrequency(Number(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">{t('dailyTargetDescription')}</p>
              </div>
            )}

            {/* Color picker */}
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t('color')}</p>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-card' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>

            {/* Goal linking */}
            <div className="space-y-1.5">
              <Label>{t('linkToGoal', { ns: 'common' })}</Label>
              <Select value={linkedGoalId || '__none__'} onValueChange={(v) => setLinkedGoalId(v === '__none__' ? undefined : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectGoal', { ns: 'common' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('noGoal', { ns: 'common' })}</SelectItem>
                  {/* Three Year Goals */}
                  {(threeYearGoalsQuery.data?.data ?? []).map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      3-year: {goal.title}
                    </SelectItem>
                  ))}
                  {/* Annual Goals */}
                  {(annualGoalsQuery.data?.data ?? []).map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      Annual: {goal.title}
                    </SelectItem>
                  ))}
                  {/* Quarterly Goals */}
                  {(quarterlyGoalsQuery.data?.data ?? []).map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      Quarterly: Q{goal.quarter} - {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isEdit ? t('saveChanges') : t('createHabit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
