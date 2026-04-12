import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  financesQueries,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
} from '../../../features/finances/queries'
import type { SavingsGoal } from '../../../features/finances/api'
import { QueryError } from '../../../components/query-error'
import { PlusIcon } from '../../../components/Icons'
import { DeleteButton } from '../../../components/action-buttons'
import { FinancesNav } from '@/features/finances/components/finances-nav'
import { CURRENCY_OPTIONS } from '../../../features/finances/constants'
import { useCurrency } from '@/features/finances/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useState } from 'react'
import { Target, CalendarDays } from 'lucide-react'

export const Route = createFileRoute('/_app/finances/savings')({
  component: SavingsPage,
})

function SavingsPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const savingsQuery = useQuery(financesQueries.savingsGoals())
  const deleteSavings = useDeleteSavingsGoal()
  const [dialogOpen, setDialogOpen] = useState(false)

  const goals = savingsQuery.data?.data ?? []

  const totalSaved = goals.reduce(
    (sum: number, g: SavingsGoal) => sum + g.currentAmount,
    0
  )
  const totalTarget = goals.reduce(
    (sum: number, g: SavingsGoal) => sum + g.targetAmount,
    0
  )

  async function handleDelete(goal: SavingsGoal) {
    try {
      await deleteSavings.mutateAsync(goal.id)
      toast.success(t('savingsDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  return (
    <FeatureGate
      feature={FEATURES.FINANCES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.FINANCES_MODULE} />}
    >
    <div className="flex h-full flex-col">
      <FinancesNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('mySavingsGoals')}</h1>
              {goals.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)} {t('saved')}
                </p>
              )}
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon /> {t('addSavingsGoal')}
            </Button>
          </div>

          {savingsQuery.isLoading && <SkeletonList lines={4} />}
          {savingsQuery.isError && (
            <QueryError message={t('failedToLoad')} onRetry={() => savingsQuery.refetch()} />
          )}

          {!savingsQuery.isLoading && !savingsQuery.isError && goals.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal: SavingsGoal) => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                    : 0
                const isNearComplete = pct >= 75
                const accentColor = isNearComplete ? 'text-green-500' : 'text-primary'
                const trackColor = isNearComplete
                  ? 'stroke-green-500/20'
                  : 'stroke-primary/20'
                const progressColor = isNearComplete
                  ? 'stroke-green-500'
                  : 'stroke-primary'

                return (
                  <Card
                    key={goal.id}
                    className="group relative transition-colors hover:bg-muted/30"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* Progress circle */}
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                strokeWidth="4"
                                className={trackColor}
                              />
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${(pct / 100) * 150.8} 150.8`}
                                className={progressColor}
                              />
                            </svg>
                            <span className={`absolute text-xs font-bold ${accentColor}`}>
                              {Math.round(pct)}%
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {goal.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatCurrency(goal.currentAmount)}{' '}
                              <span className="text-muted-foreground/60">
                                / {formatCurrency(goal.targetAmount)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <DeleteButton onClick={() => handleDelete(goal)} />
                      </div>

                      {/* Bottom info */}
                      <div className="mt-4 flex items-center gap-3 border-t pt-3">
                        {goal.targetDate ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Target className="h-3.5 w-3.5" />
                            {t('noTargetDate')}
                          </div>
                        )}
                        <div className="ml-auto text-xs font-medium text-muted-foreground">
                          {formatCurrency(goal.targetAmount - goal.currentAmount)} {t('remaining')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!savingsQuery.isLoading && !savingsQuery.isError && goals.length === 0 && (
            <EmptyState
              title={t('noSavings')}
              description={t('noSavingsDescription')}
            />
          )}
        </div>
      </div>

      <SavingsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
    </FeatureGate>
  )
}

function SavingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('finances')
  const createSavings = useCreateSavingsGoal()

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setTargetAmount('')
    setCurrentAmount('')
    setTargetDate('')
    setCurrency('USD')
  }
  if (open !== prevOpen) setPrevOpen(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !targetAmount) return

    try {
      await createSavings.mutateAsync({
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate: targetDate || undefined,
        currency,
      })
      toast.success(t('savingsCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t('newSavingsGoal')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('addSavingsGoal')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <Label>{t('goalName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('targetAmount')}</Label>
                <Input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('currentAmount')}</Label>
                <Input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('targetDate')}</Label>
                <DatePicker
                  date={targetDate ? new Date(targetDate + 'T00:00:00') : undefined}
                  onDateChange={(d) => setTargetDate(d ? d.toISOString().split('T')[0]! : '')}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('currency', { ns: 'common' })}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t px-6 py-4 bg-muted/10">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!name.trim() || !targetAmount || createSavings.isPending}>{t('addSavingsGoal')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
