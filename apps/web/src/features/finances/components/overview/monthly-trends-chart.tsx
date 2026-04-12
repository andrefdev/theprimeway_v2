import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useTranslation } from 'react-i18next'
import { CurrencyAmount } from '@/components/currency-amount'

interface MonthlyTrendsChartProps {
  data: { month: string; income: number; expenses: number; net: number }[]
  currency?: string
}

const COLORS = {
  expense: '#ef4444',
}

export function MonthlyTrendsChart({
  data,
  currency = 'USD',
}: MonthlyTrendsChartProps) {
  const { t } = useTranslation('finances')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('monthlyTrend')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer
            id="monthly-expenses-line"
            className="aspect-auto h-64"
            config={{
              expenses: { label: t('expenses'), color: COLORS.expense },
            }}
          >
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: currency,
                    notation: 'compact',
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <CurrencyAmount
                        amount={Number(value)}
                        currency={currency}
                        compact
                      />
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="var(--color-expenses)"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('noTrendData')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
