import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useLocale } from '@/i18n/useLocale'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/shared/components/ui/dialog'
import { useCreateHabit, useUpdateHabit } from '@/features/habits/queries'
import { goalsQueries } from '@/features/goals/queries'
import { LIFE_PILLARS, CATEGORY_TO_PILLAR } from '@repo/shared/constants'
import type { Habit } from '@repo/shared/types'

const COLOR_OPTIONS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16',
]

export function HabitDialog({
  open,
  onClose,
  habit,
}: {
  open: boolean
  onClose: () => void
  habit: Habit | null
}) {
  const { t } = useTranslation('habits')
  const { dateFnsLocale } = useLocale()
  // Sunday=0..Saturday=6 — derive short labels from current locale
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i) // 2024-01-07 is a Sunday
    const s = format(d, 'EEEEEE', { locale: dateFnsLocale })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })
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
            <DialogDescription>
              {isEdit
                ? t('editDescription', { defaultValue: 'Update your habit details.' })
                : t('createDescription', { defaultValue: 'Create a new habit to track.' })}
            </DialogDescription>
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

            <div className="space-y-1.5">
              <Label>{t('linkToGoal', { ns: 'common' })}</Label>
              <Select value={linkedGoalId || '__none__'} onValueChange={(v) => setLinkedGoalId(v === '__none__' ? undefined : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectGoal', { ns: 'common' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('noGoal', { ns: 'common' })}</SelectItem>
                  {(threeYearGoalsQuery.data?.data ?? []).map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {t('horizonThreeYear', { defaultValue: '3-year' })}: {goal.title}
                    </SelectItem>
                  ))}
                  {(annualGoalsQuery.data?.data ?? []).map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {t('horizonAnnual', { defaultValue: 'Annual' })}: {goal.title}
                    </SelectItem>
                  ))}
                  {(quarterlyGoalsQuery.data?.data ?? []).map((goal: any) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {t('horizonQuarterly', { defaultValue: 'Quarterly' })}: Q{goal.quarter} - {goal.title}
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
