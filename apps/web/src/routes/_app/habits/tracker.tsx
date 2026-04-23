import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  habitsQueries,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
} from '@/features/habits/queries'
import { HabitTracker } from '@/features/habits/components/HabitTracker'
import { HabitsNav } from '@/features/habits/components/HabitsNav'
import { HabitDialog } from '@/features/habits/components/HabitDialog'
import { StreakProtectionAlert } from '@/features/habits/components/StreakProtectionAlert'
import { QueryError } from '@/shared/components/QueryError'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Progress } from '@/shared/components/ui/progress'
import { Button } from '@/shared/components/ui/button'
import { PlusIcon } from '@/shared/components/Icons'
import { useLocale } from '@/i18n/useLocale'
import type { Habit } from '@repo/shared/types'

export const Route = createFileRoute('/_app/habits/tracker')({
  component: HabitsTrackerPage,
})

function HabitsTrackerPage() {
  const { t } = useTranslation('habits')
  const { dateFnsLocale } = useLocale()
  const today = format(new Date(), 'yyyy-MM-dd')
  const habitsQuery = useQuery(habitsQueries.todayWithLogs(today))
  const toggleLog = useToggleHabitLog()
  const deleteHabit = useDeleteHabit()
  const updateHabit = useUpdateHabit()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const habits = habitsQuery.data?.data ?? []
  const totalHabits = habits.length
  const completedToday = useMemo(
    () =>
      habits.filter((h) => {
        const todayLog = h.logs?.find((l) => l.date.startsWith(today))
        return todayLog && todayLog.completedCount >= h.targetFrequency
      }).length,
    [habits, today],
  )

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

  async function handleArchive(habit: Habit) {
    try {
      await updateHabit.mutateAsync({ id: habit.id, data: { isActive: false } })
      toast.success(t('habitArchived'))
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
        description={`${completedToday}/${totalHabits} ${t('completedToday')}`}
        actions={<Button onClick={openCreate}><PlusIcon /> {t('newHabit')}</Button>}
      />
      <div className="mx-auto w-full px-6 pb-6 space-y-6">
        <StreakProtectionAlert />

        {totalHabits > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{t('todaysProgress')}</span>
              <span>{Math.round((completedToday / totalHabits) * 100)}%</span>
            </div>
            <Progress value={Math.round((completedToday / totalHabits) * 100)} />
          </div>
        )}

        {habitsQuery.isLoading && <SkeletonList lines={5} />}
        {habitsQuery.isError && (
          <QueryError message={t('failedToLoad')} onRetry={() => habitsQuery.refetch()} />
        )}

        {!habitsQuery.isLoading && !habitsQuery.isError && (
          habits.length > 0 ? (
            <HabitTracker
              habits={habits}
              onToggle={(h, date) => handleToggle(h, date)}
              onEdit={openEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ) : (
            <EmptyState title={t('noHabitsYet')} description={t('noHabitsDescription')} />
          )
        )}
      </div>

      <HabitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        habit={editingHabit}
      />
    </div>
  )
}
