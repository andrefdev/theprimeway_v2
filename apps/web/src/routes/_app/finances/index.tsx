import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { SectionHeader } from '@/components/SectionHeader'
import { financesQueries } from '@/features/finances/queries'
import { FinancesNav } from '@/features/finances/components/FinancesNav'
import { FinancialSummaryCards } from '@/features/finances/components/overview/FinancialSummaryCards'
import { useFinancialAnalytics } from '@/features/finances/hooks/use-financial-analytics'
import { useCurrency } from '@/features/finances/hooks/use-currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'
import type { FinanceAccount, Transaction } from '@repo/shared/types'

export const Route = createFileRoute('/_app/finances/')({
  component: FinancesPage,
})

function FinancesPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency, currency: baseCurrency } = useCurrency()
  const accountsQuery = useQuery(financesQueries.accounts())
  const transactionsQuery = useQuery(
    financesQueries.transactions({ limit: '500', sortBy: 'date_desc' }),
  )
  const budgetsQuery = useQuery(financesQueries.budgets())

  const accounts = accountsQuery.data?.data ?? []
  const transactions = transactionsQuery.data?.data ?? []
  const budgets = budgetsQuery.data?.data ?? []

  const isLoading =
    accountsQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading

  const { currentMonthStats, budgetPerformance } = useFinancialAnalytics({
    transactions,
    budgets,
  })

  // Cash balance (non-credit accounts)
  const cashAccounts = accounts.filter(
    (a: FinanceAccount) => a.type !== 'credit_card' && a.isActive,
  )
  const totalCashBalance = cashAccounts.reduce(
    (sum: number, a: FinanceAccount) => sum + a.currentBalance,
    0,
  )

  // At-risk budgets (>=90%)
  const atRiskBudgets = budgetPerformance.filter((b) => b.percentage >= 90)

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5)

  return (
    <FeatureGate
      feature={FEATURES.FINANCES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.FINANCES_MODULE} />}
    >
      <div className="flex h-full flex-col">
        <FinancesNav />

        <div className="flex-1 overflow-y-auto">
          <SectionHeader sectionId="finances" title={t('title')} />
          <div className="mx-auto max-w-4xl space-y-8 px-4 pb-8">
          {isLoading ? (
            <SkeletonList lines={8} />
          ) : (
            <>
              {/* Financial Summary Cards */}
              <FinancialSummaryCards
                netWorth={totalCashBalance}
                monthlyIncome={currentMonthStats.income}
                monthlyExpenses={currentMonthStats.expenses}
                currency={baseCurrency}
              />

              {/* Cash Balance */}
              <Card className="rounded-lg border bg-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t('cashBalance')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalCashBalance)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cashAccounts.length} {t('accounts')}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-14 flex-1 border-dashed text-base font-medium active:scale-95 transition-transform"
                  asChild
                >
                  <Link to="/finances/history">
                    <Minus className="mr-2 h-5 w-5 text-red-500" />
                    {t('addExpense')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 flex-1 border-dashed text-base font-medium active:scale-95 transition-transform"
                  asChild
                >
                  <Link to="/finances/history">
                    <Plus className="mr-2 h-5 w-5 text-green-500" />
                    {t('addIncome')}
                  </Link>
                </Button>
              </div>

              {/* Contextual Alerts */}
              {atRiskBudgets.length > 0 && (
                <div className="space-y-3">
                  {atRiskBudgets.map((budget) => (
                    <div
                      key={budget.name}
                      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
                        {budget.name}: {budget.percentage.toFixed(0)}%{' '}
                        {t('budgetUsed')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Budget Progress */}
              {budgetPerformance.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('budgetProgress')}
                    </h3>
                    <Link
                      to="/finances/monthly"
                      className="text-xs text-primary hover:underline"
                    >
                      {t('viewAll')}
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {budgetPerformance.slice(0, 4).map((budget) => (
                      <Card key={budget.name}>
                        <CardContent className="p-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <p className="text-sm font-medium">{budget.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(budget.spent)} /{' '}
                                {formatCurrency(budget.allocated)}
                              </span>
                              <Badge
                                variant={
                                  budget.isOverBudget
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {budget.percentage.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={budget.percentage} className="h-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('recentTransactions')}
                    </h3>
                    <Link
                      to="/finances/history"
                      className="text-xs text-primary hover:underline"
                    >
                      {t('viewAll')}
                    </Link>
                  </div>
                  <Card>
                    <CardContent className="divide-y p-0">
                      {recentTransactions.map((tx: Transaction) => (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              tx.type === 'income'
                                ? 'bg-green-500/10'
                                : tx.type === 'expense'
                                  ? 'bg-red-500/10'
                                  : 'bg-blue-500/10'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {tx.description || tx.category || t('transaction')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.date).toLocaleDateString()}
                            </p>
                          </div>
                          <p
                            className={`text-sm font-medium ${
                              tx.type === 'income'
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(Math.abs(tx.amount), tx.currency)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Account Balances */}
              {accounts.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('navAccounts')}
                    </h3>
                    <Link
                      to="/finances/accounts"
                      className="text-xs text-primary hover:underline"
                    >
                      {t('viewAll')}
                    </Link>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {accounts.slice(0, 4).map((account: FinanceAccount) => (
                      <Card
                        key={account.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <CardContent className="flex items-center gap-3 p-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAccountColorClass(account.type)}`}
                          >
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {account.name}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize"
                            >
                              {account.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p
                            className={`text-sm font-bold ${
                              account.currentBalance >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {formatCurrency(
                              account.currentBalance,
                              account.currency,
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </FeatureGate>
  )
}

function getAccountColorClass(type: string) {
  switch (type) {
    case 'checking':
      return 'bg-blue-500/10 text-blue-500'
    case 'savings':
      return 'bg-green-500/10 text-green-500'
    case 'credit_card':
      return 'bg-purple-500/10 text-purple-500'
    case 'investment':
      return 'bg-orange-500/10 text-orange-500'
    case 'cash':
      return 'bg-yellow-500/10 text-yellow-500'
    default:
      return 'bg-primary/10 text-primary'
  }
}
