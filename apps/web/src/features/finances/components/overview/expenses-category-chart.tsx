import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { useTranslation } from 'react-i18next'
import { CurrencyAmount } from '@/components/currency-amount'

interface ExpensesCategoryChartProps {
  data: { name: string; value: number }[]
  currency?: string
}

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#ec4899',
  '#6366f1',
]

export function ExpensesCategoryChart({
  data,
  currency = 'USD',
}: ExpensesCategoryChartProps) {
  const { t } = useTranslation('finances')

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      configKey: `item_${index}` as string,
      fill: `var(--color-item_${index})` as string,
    }))
  }, [data])

  const chartConfig = useMemo(() => {
    return chartData.reduce(
      (acc, item, idx) => {
        acc[item.configKey] = {
          label: item.name,
          color: CHART_COLORS[idx % CHART_COLORS.length]!,
        }
        return acc
      },
      {} as Record<string, { label: string; color: string }>,
    )
  }, [chartData])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {t('expensesByCategory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <ChartContainer
              id="expenses-pie"
              className="aspect-auto h-64"
              config={chartConfig}
            >
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="configKey"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.configKey} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) => (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor:
                                chartConfig[name as string]?.color ||
                                item.payload.fill ||
                                item.color,
                            }}
                          />
                          <span className="text-muted-foreground">
                            {chartConfig[name as string]?.label || String(name)}
                          </span>
                          <CurrencyAmount
                            amount={Number(value)}
                            currency={currency}
                            compact
                          />
                        </div>
                      )}
                    />
                  }
                />
              </RechartsPieChart>
            </ChartContainer>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {data.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span className="truncate text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <PieChart className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t('noExpenseData')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
