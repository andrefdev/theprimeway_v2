import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target } from 'lucide-react'
import { CurrencyAmount } from '@/components/currency-amount'
import { useTranslation } from 'react-i18next'
import type { SavingsGoal } from '../../api'

interface SavingsGoalsProgressProps {
  goals: SavingsGoal[]
  currency?: string
  currencyRates?: Record<string, number>
}

export function SavingsGoalsProgress({
  goals,
  currency = 'USD',
  currencyRates,
}: SavingsGoalsProgressProps) {
  const { t } = useTranslation('finances')

  if (goals.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('savingsGoalsProgress')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.slice(0, 3).map((goal) => {
          let currentAmount = goal.currentAmount || 0
          let targetAmount = goal.targetAmount

          if (currencyRates && goal.currency && goal.currency !== currency) {
            const rate = currencyRates[goal.currency]
            if (rate) {
              currentAmount = currentAmount * rate
              targetAmount = targetAmount * rate
            }
          }

          const progress = (currentAmount / targetAmount) * 100

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{goal.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    <CurrencyAmount
                      amount={currentAmount}
                      currency={currency}
                      compact
                    />
                    {' / '}
                    <CurrencyAmount
                      amount={targetAmount}
                      currency={currency}
                      compact
                    />
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {progress.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
              {goal.targetDate && (
                <p className="text-muted-foreground text-xs">
                  {t('target')}:{' '}
                  {new Date(goal.targetDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
