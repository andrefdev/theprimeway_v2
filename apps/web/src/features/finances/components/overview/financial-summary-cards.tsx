import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { CurrencyAmount } from '@/components/currency-amount'
import { useCurrencySettings } from '@/features/settings/hooks/use-currency-settings'

interface FinancialSummaryCardsProps {
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  currency?: string
}

export function FinancialSummaryCards({
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  currency,
}: FinancialSummaryCardsProps) {
  const { t } = useTranslation('finances')
  const { settings } = useCurrencySettings()
  const displayCurrency = currency || settings?.baseCurrency || 'USD'

  const savingsRate =
    monthlyIncome > 0
      ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1)
      : '0'

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('totalBalance')}
          </CardTitle>
          <CircleDollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold',
              netWorth >= 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            <CurrencyAmount
              amount={netWorth}
              currency={displayCurrency}
              size="lg"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {netWorth >= 0 ? t('positiveCashFlow') : t('negativeCashFlow')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('monthlyIncome')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            <CurrencyAmount
              amount={monthlyIncome}
              currency={displayCurrency}
              size="lg"
            />
          </div>
          <p className="text-muted-foreground text-xs">{t('thisMonth')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('monthlyExpenses')}
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            <CurrencyAmount
              amount={monthlyExpenses}
              currency={displayCurrency}
              size="lg"
            />
          </div>
          <p className="text-muted-foreground text-xs">{t('thisMonth')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('savingsRate')}
          </CardTitle>
          <Target className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{savingsRate}%</div>
          <p className="text-muted-foreground text-xs">
            {t('ofMonthlyIncome')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
