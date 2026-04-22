import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  goalsQueries,
  useCreateThreeYearGoal,
  useUpdateThreeYearGoal,
  useCreateAnnualGoal,
  useUpdateAnnualGoal,
  useCreateQuarterlyGoal,
  useUpdateQuarterlyGoal,
} from '@/features/goals/queries'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/shared/components/ui/dialog'
import { DatePicker } from '@/shared/components/ui/date-picker'
import type { PrimeVision, ThreeYearGoal, AnnualGoal } from '@repo/shared/types'
import { AREAS, type UnifiedGoal, type GoalLevel, toArray } from './goals-shared'

export function GoalDialog({
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
  const [area, setArea] = useState('lifestyle')
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
        setArea(d.area ?? 'lifestyle')
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
      setArea('lifestyle')
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

            {level === 'three-year' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('linkToVision')}</Label>
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
              <div className="space-y-1.5">
                <Label>{t('linkToThreeYearGoal')}</Label>
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
            )}

            {level === 'quarterly' && (
              <>
                <div className="space-y-1.5">
                  <Label>{t('linkToAnnualGoal')}</Label>
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

            {level === 'annual' && (
              <div className="space-y-1.5">
                <Label>{t('deadline')}</Label>
                <DatePicker
                  date={targetDate ? new Date(targetDate + 'T00:00:00') : undefined}
                  onDateChange={(d) => setTargetDate(d ? d.toISOString().split('T')[0]! : '')}
                  className="w-full"
                />
              </div>
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
