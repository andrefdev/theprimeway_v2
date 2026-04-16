import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusIcon,
  Target,
} from 'lucide-react'
import {
  financesQueries,
  useCreateBudget,
  useDeleteBudget,
} from '@/features/finances/queries'
import { FinancesNav } from '@/features/finances/components/FinancesNav'
import { useCurrency } from '@/features/finances/hooks/use-currency'
import { useFinancialAnalytics } from '@/features/finances/hooks/use-financial-analytics'
import { QueryError } from '@/shared/components/QueryError'
import { DeleteButton } from '@/shared/components/ActionButtons'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { Progress } from '@/shared/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { EXPENSE_CATEGORY_OPTIONS } from '@/features/finances/constants'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import type { Budget } from '@repo/shared/types'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/finances/monthly')({
  component: MonthlyBudgetPage,
})

function MonthlyBudgetPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const budgetsQuery = useQuery(financesQueries.budgets())
  const transactionsQuery = useQuery(
    financesQueries.transactions({ limit: '500', sortBy: 'date_desc' }),
  )
  const deleteBudget = useDeleteBudget()
  const [dialogOpen, setDialogOpen] = useState(false)

  const budgets = budgetsQuery.data?.data ?? []
  const transactions = transactionsQuery.data?.data ?? []

  const { currentMonthStats, budgetPerformance } = useFinancialAnalytics({
    transactions,
    budgets,
  })

  const totalBudget = budgets.reduce(
    (sum: number, b: Budget) => sum + b.totalAmount,
    0,
  )
  const net = currentMonthStats.income - currentMonthStats.expenses

  const isLoading = budgetsQuery.isLoading || transactionsQuery.isLoading

  async function handleDelete(budget: Budget) {
    try {
      await deleteBudget.mutateAsync(budget.id)
      toast.success(t('budgetDeleted'))
    } catch {
      toast.error(t('failedToDeleteBudget'))
    }
  }

  // Map budget performance data by name for quick lookup
  const performanceByName = new Map(
    budgetPerformance.map((bp) => [bp.name, bp]),
  )

  return (
    <FeatureGate
      feature={FEATURES.FINANCES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.FINANCES_MODULE} />}
    >
    <div className="flex h-full flex-col">
      <FinancesNav />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-12 px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('budgets')}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t('totalBudgeted')} {formatCurrency(totalBudget)}
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" /> {t('newBudget')}
            </Button>
          </div>

          {/* Cash Flow Section */}
          <div className="grid grid-cols-3 gap-4">
            {/* Income */}
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {t('income')}
                    </p>
                    <p className="truncate text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(currentMonthStats.income)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                    <TrendingDown className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {t('expenses')}
                    </p>
                    <p className="truncate text-2xl font-bold text-rose-700 dark:text-rose-300">
                      {formatCurrency(currentMonthStats.expenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net */}
            <Card
              className={cn(
                net >= 0
                  ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20'
                  : 'border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      net >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
                    )}
                  >
                    <DollarSign
                      className={cn(
                        'h-5 w-5',
                        net >= 0 ? 'text-blue-500' : 'text-orange-500',
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-xs font-medium uppercase tracking-wider',
                        net >= 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-orange-600 dark:text-orange-400',
                      )}
                    >
                      {t('net')}
                    </p>
                    <p
                      className={cn(
                        'truncate text-2xl font-bold',
                        net >= 0
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-orange-700 dark:text-orange-300',
                      )}
                    >
                      {net >= 0 ? '+' : ''}
                      {formatCurrency(net)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Cards */}
          {isLoading && <SkeletonList lines={4} />}
          {budgetsQuery.isError && (
            <QueryError
              message={t('failedToLoadBudgets')}
              onRetry={() => budgetsQuery.refetch()}
            />
          )}

          {!isLoading && !budgetsQuery.isError && budgets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">
                {t('budgetProgress')}
              </h2>
              <div className="space-y-3">
                {budgets.map((budget: Budget) => {
                  const perf = performanceByName.get(budget.name)
                  const spent = perf?.spent ?? 0
                  const allocated = perf?.allocated ?? budget.totalAmount
                  const pct = perf?.percentage ?? 0
                  const isOverBudget = perf?.isOverBudget ?? false
                  const remaining = allocated - spent

                  return (
                    <Card
                      key={budget.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {budget.name}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] capitalize"
                                >
                                  {budget.category}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {budget.period}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">
                                {formatCurrency(spent)} /{' '}
                                {formatCurrency(allocated)}
                              </p>
                              <p
                                className={cn(
                                  'text-[10px]',
                                  remaining >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-destructive',
                                )}
                              >
                                {formatCurrency(Math.abs(remaining))}{' '}
                                {remaining >= 0
                                  ? t('remaining')
                                  : t('overBudget')}
                              </p>
                            </div>
                            <DeleteButton
                              onClick={() => handleDelete(budget)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress
                            value={pct}
                            className={cn(
                              'h-2 flex-1',
                              isOverBudget
                                ? 'bg-destructive/20 *:bg-destructive'
                                : '',
                            )}
                          />
                          <Badge
                            variant={isOverBudget ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {pct.toFixed(0)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {!isLoading &&
            !budgetsQuery.isError &&
            budgets.length === 0 && (
              <EmptyState
                title={t('noBudgets')}
                description={t('noBudgetsDescription')}
              />
            )}
        </div>
      </div>

      <BudgetDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
    </FeatureGate>
  )
}

function BudgetDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('finances')
  const createBudget = useCreateBudget()

  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [category, setCategory] = useState('')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setTotalAmount('')
    setCategory('')
  }
  if (open !== prevOpen) setPrevOpen(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !totalAmount) return

    try {
      await createBudget.mutateAsync({
        name: name.trim(),
        totalAmount: parseFloat(totalAmount),
        categoryType: category.trim() || 'expense',
      })
      toast.success(t('budgetCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreateBudget'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t('newBudget')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <Label>{t('budgetName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('budgetNamePlaceholder')}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('budgetAmount')}</Label>
              <Input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder={t('budgetAmountPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('budgetCategory')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/10 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() || !totalAmount || createBudget.isPending
              }
            >
              {t('createBudget')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
