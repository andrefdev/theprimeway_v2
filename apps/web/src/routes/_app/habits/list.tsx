import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Archive, ArchiveRestore } from 'lucide-react'
import {
  habitsQueries,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
} from '@/features/habits/queries'
import { HabitsNav } from '@/features/habits/components/HabitsNav'
import { HabitDialog } from '@/features/habits/components/HabitDialog'
import { HabitsFilters } from '@/features/habits/components/HabitsFilters'
import { HabitDetailPanel } from '@/features/habits/components/HabitDetailPanel'
import { HabitListCard } from '@/features/habits/components/HabitListCard'
import { QueryError } from '@/shared/components/QueryError'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { PlusIcon } from '@/shared/components/Icons'
import { useLocale } from '@/i18n/useLocale'
import type { Habit } from '@repo/shared/types'
import { CATEGORY_TO_PILLAR } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/habits/list')({
  component: HabitsListPage,
})

function HabitsListPage() {
  const { t } = useTranslation('habits')
  const { dateFnsLocale } = useLocale()
  const today = format(new Date(), 'yyyy-MM-dd')
  const habitsQuery = useQuery(habitsQueries.todayWithLogs(today))
  const archivedQuery = useQuery(habitsQueries.list({ isActive: 'false' }))
  const toggleLog = useToggleHabitLog()
  const deleteHabit = useDeleteHabit()
  const updateHabit = useUpdateHabit()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const habits = habitsQuery.data?.data ?? []
  const archivedHabits = archivedQuery.data?.data ?? []

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

  async function handleToggle(habit: Habit) {
    const log = habit.logs?.find((l) => l.date.startsWith(today))
    const currentCount = log?.completedCount ?? 0
    const isComplete = currentCount >= habit.targetFrequency
    const newCount = isComplete ? 0 : Math.min(currentCount + 1, habit.targetFrequency)

    try {
      await toggleLog.mutateAsync({
        habitId: habit.id,
        data: { date: today, completedCount: newCount },
      })
      if (newCount >= habit.targetFrequency) {
        toast.success(t('habitCompletedToast', { name: habit.name }))
      }
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleArchive(habit: Habit) {
    try {
      await updateHabit.mutateAsync({ id: habit.id, data: { isActive: false } })
      toast.success(t('habitArchived'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleRestore(habit: Habit) {
    try {
      await updateHabit.mutateAsync({ id: habit.id, data: { isActive: true } })
      toast.success(t('habitRestored'))
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
      <HabitsNav />
      <SectionHeader
        sectionId="habits"
        title={format(new Date(), 'EEEE, MMMM d', { locale: dateFnsLocale })}
        description={t('tabList')}
        actions={<Button onClick={openCreate}><PlusIcon /> {t('newHabit')}</Button>}
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {habitsQuery.isLoading && <SkeletonList lines={5} />}
        {habitsQuery.isError && (
          <QueryError message={t('failedToLoad')} onRetry={() => habitsQuery.refetch()} />
        )}

        {!habitsQuery.isLoading && !habitsQuery.isError && (
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
                  <HabitListCard
                    key={habit.id}
                    habit={habit}
                    today={today}
                    onToggle={() => handleToggle(habit)}
                    onEdit={() => openEdit(habit)}
                    onDelete={() => handleDelete(habit)}
                    onArchive={() => handleArchive(habit)}
                    onView={() => setSelectedHabit(habit)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title={t('noHabitsYet')} description={t('noHabitsDescription')} />
            )}

            {archivedHabits.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Archive className="size-3.5" />
                  {t('archivedHabits', { count: archivedHabits.length })}
                </button>
                {showArchived && (
                  <div className="mt-2 space-y-2 opacity-60">
                    {archivedHabits.map((habit) => (
                      <Card key={habit.id} className="overflow-hidden">
                        <CardContent className="flex items-center justify-between p-3">
                          <span className="text-sm text-muted-foreground">{habit.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(habit)}
                            className="text-xs"
                          >
                            <ArchiveRestore className="size-3.5 mr-1" />
                            {t('restore')}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={!!selectedHabit} onOpenChange={(open) => { if (!open) setSelectedHabit(null) }}>
        <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px]">
          {selectedHabit && <HabitDetailPanel habit={selectedHabit} />}
        </SheetContent>
      </Sheet>

      <HabitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        habit={editingHabit}
      />
    </div>
  )
}
