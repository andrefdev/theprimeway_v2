import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { CurrencyAmount } from '@/components/CurrencyAmount'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface CashFlowAnalysisProps {
  averageIncome: number
  averageExpenses: number
  averageNet: number
  currency?: string
}

export function CashFlowAnalysis({
  averageIncome,
  averageExpenses,
  averageNet,
  currency = 'USD',
}: CashFlowAnalysisProps) {
  const { t } = useTranslation('finances')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('cashFlowAnalysis')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('averageMonthlyIncome')}</span>
            <span className="font-medium text-green-600">
              <CurrencyAmount
                amount={averageIncome}
                currency={currency}
                compact
              />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('averageMonthlyExpenses')}</span>
            <span className="font-medium text-red-600">
              <CurrencyAmount
                amount={averageExpenses}
                currency={currency}
                compact
              />
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm font-medium">
              {t('averageNetIncome')}
            </span>
            <span
              className={cn(
                'font-medium',
                averageNet >= 0 ? 'text-green-600' : 'text-red-600',
              )}
            >
              <CurrencyAmount
                amount={averageNet}
                currency={currency}
                compact
              />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
