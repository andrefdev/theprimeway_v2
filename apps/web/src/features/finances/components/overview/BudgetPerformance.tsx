import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PieChart } from 'lucide-react'
import { CurrencyAmount } from '@/components/CurrencyAmount'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface BudgetPerformanceItem {
  name: string
  allocated: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

interface BudgetPerformanceProps {
  data: BudgetPerformanceItem[]
  currency?: string
}

export function BudgetPerformance({
  data,
  currency = 'USD',
}: BudgetPerformanceProps) {
  const { t } = useTranslation('finances')

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {t('budgetPerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  <CurrencyAmount
                    amount={item.spent}
                    currency={currency}
                    compact
                  />
                  {' / '}
                  <CurrencyAmount
                    amount={item.allocated}
                    currency={currency}
                    compact
                  />
                </span>
                <Badge
                  variant={item.isOverBudget ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {item.percentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
            <Progress
              value={item.percentage}
              className={cn(
                'h-2',
                item.isOverBudget
                  ? 'bg-destructive/20 *:bg-destructive'
                  : '',
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
