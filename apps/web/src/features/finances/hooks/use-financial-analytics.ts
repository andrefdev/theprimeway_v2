import { useMemo } from 'react'
import type { Transaction, Budget } from '@repo/shared/types'
import type { SavingsGoal } from '../api'
import { useCurrencySettings } from '@/features/settings/hooks/use-currency-settings'
import { useTranslation } from 'react-i18next'
import { useExchangeRates } from './use-exchange-rates'

interface AnalyticsTransaction extends Transaction {
  budgetId?: string | null
}

interface UseFinancialAnalyticsProps {
  transactions: AnalyticsTransaction[]
  budgets: Budget[]
  goals?: SavingsGoal[]
  targetMonth?: string
}

export function useFinancialAnalytics({
  transactions,
  budgets,
  goals: _goals = [],
  targetMonth,
}: UseFinancialAnalyticsProps) {
  const { t } = useTranslation('finances')
  const { settings } = useCurrencySettings()
  const baseCurrency = settings?.baseCurrency || 'USD'
  const { data: rates = [] } = useExchangeRates()

  const getConvertedAmount = (amount: number, currency: string) => {
    if (currency === baseCurrency) return amount

    const directRate = rates.find(
      (r) => r.fromCurrency === currency && r.toCurrency === baseCurrency,
    )
    if (directRate) return amount * parseFloat(directRate.rate)

    const inverseRate = rates.find(
      (r) => r.fromCurrency === baseCurrency && r.toCurrency === currency,
    )
    if (inverseRate) return amount * (1 / parseFloat(inverseRate.rate))

    return amount
  }

  const analytics = useMemo(() => {
    const CONFIRMED_STATUSES = ['included', 'cleared', 'reconciled']

    const currentMonth =
      targetMonth || new Date().toISOString().slice(0, 7)
    const currentMonthTransactions = transactions.filter(
      (tx) =>
        CONFIRMED_STATUSES.includes(tx.status) &&
        tx.date.startsWith(currentMonth),
    )

    // Expenses by category for pie chart
    const expensesByGroup = currentMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce(
        (acc, tx) => {
          const group =
            budgets.find((b) => b.id === tx.budgetId)?.name ||
            t('unbudgeted')
          const amt = getConvertedAmount(tx.amount, tx.currency)
          acc[group] = (acc[group] || 0) + amt
          return acc
        },
        {} as Record<string, number>,
      )

    const pieChartData = Object.entries(expensesByGroup)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    // Monthly trends for the last 6 months
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthKey = date.toISOString().slice(0, 7)

      const monthTransactions = transactions.filter(
        (tx) =>
          CONFIRMED_STATUSES.includes(tx.status) &&
          tx.date.startsWith(monthKey),
      )

      const income = monthTransactions
        .filter((tx) => tx.type === 'income')
        .reduce(
          (sum, tx) => sum + getConvertedAmount(tx.amount, tx.currency),
          0,
        )

      const expenses = monthTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce(
          (sum, tx) => sum + getConvertedAmount(tx.amount, tx.currency),
          0,
        )

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses,
        net: income - expenses,
      }
    })

    // Budget performance
    const budgetPerformance = budgets.map((budget) => {
      const expensesForBudget = currentMonthTransactions
        .filter((tx) => tx.type === 'expense' && tx.budgetId === budget.id)
        .reduce(
          (sum, tx) => sum + getConvertedAmount(tx.amount, tx.currency),
          0,
        )

      const totalAllocated = getConvertedAmount(
        budget.totalAmount,
        budget.currency,
      )
      const percentage =
        totalAllocated > 0 ? (expensesForBudget / totalAllocated) * 100 : 0

      return {
        name: budget.name,
        allocated: totalAllocated,
        spent: expensesForBudget,
        remaining: Math.max(totalAllocated - expensesForBudget, 0),
        percentage: Math.min(percentage, 100),
        isOverBudget: expensesForBudget > totalAllocated,
      }
    })

    const averageIncome =
      monthlyTrends.reduce((sum, m) => sum + m.income, 0) /
      (monthlyTrends.length || 1)
    const averageExpenses =
      monthlyTrends.reduce((sum, m) => sum + m.expenses, 0) /
      (monthlyTrends.length || 1)
    const averageNet =
      monthlyTrends.reduce((sum, m) => sum + m.net, 0) /
      (monthlyTrends.length || 1)

    const currentMonthIncome = currentMonthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce(
        (sum, tx) => sum + getConvertedAmount(tx.amount, tx.currency),
        0,
      )

    const currentMonthExpenses = currentMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce(
        (sum, tx) => sum + getConvertedAmount(tx.amount, tx.currency),
        0,
      )

    const currentMonthNet = currentMonthIncome - currentMonthExpenses
    const currentMonthSavingsRate =
      currentMonthIncome > 0
        ? (currentMonthNet / currentMonthIncome) * 100
        : 0

    return {
      pieChartData,
      monthlyTrends,
      budgetPerformance,
      averages: {
        income: averageIncome,
        expenses: averageExpenses,
        net: averageNet,
      },
      currentMonthStats: {
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
        net: currentMonthNet,
        savingsRate: currentMonthSavingsRate,
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, budgets, t, baseCurrency, targetMonth, rates])

  return { ...analytics, baseCurrency, currencyRates: {} }
}
