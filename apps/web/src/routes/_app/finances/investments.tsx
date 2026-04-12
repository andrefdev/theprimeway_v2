import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  financesQueries,
  useCreateInvestment,
  useDeleteInvestment,
} from '../../../features/finances/queries'
import type { InvestmentHolding } from '@/features/finances/api'
import { QueryError } from '../../../components/query-error'
import { PlusIcon } from '../../../components/Icons'
import { DeleteButton } from '../../../components/action-buttons'
import { FinancesNav } from '@/features/finances/components/finances-nav'
import { useCurrency } from '@/features/finances/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CURRENCY_OPTIONS } from '../../../features/finances/constants'

export const Route = createFileRoute('/_app/finances/investments')({
  component: InvestmentsPage,
})

const CATEGORY_COLORS: Record<string, string> = {
  stocks: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  etf: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  crypto: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  bonds: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  real_estate: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

function InvestmentsPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const investmentsQuery = useQuery(financesQueries.investments())
  const deleteInvestment = useDeleteInvestment()
  const [dialogOpen, setDialogOpen] = useState(false)

  const investments = investmentsQuery.data?.data ?? []

  const totalValue = investments.reduce(
    (sum: number, inv: InvestmentHolding) => sum + inv.currentPrice * inv.quantity,
    0,
  )
  const totalInvested = investments.reduce(
    (sum: number, inv: InvestmentHolding) => sum + inv.avgCostPrice * inv.quantity,
    0,
  )
  const totalGain = totalValue - totalInvested
  const returnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  const isPortfolioGain = totalGain >= 0

  async function handleDelete(investment: InvestmentHolding) {
    try {
      await deleteInvestment.mutateAsync(investment.id)
      toast.success(t('investmentDeleted'))
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
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{t('myInvestments')}</h1>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon /> {t('addInvestment')}
            </Button>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalValue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalInvested')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalGain')}</CardTitle>
                {isPortfolioGain ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    isPortfolioGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  {isPortfolioGain ? '+' : ''}
                  {formatCurrency(totalGain)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('returnPct')}</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    isPortfolioGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  {isPortfolioGain ? '+' : ''}
                  {returnPct.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Loading / Error */}
          {investmentsQuery.isLoading && <SkeletonList lines={4} />}
          {investmentsQuery.isError && (
            <QueryError
              message={t('failedToCreate')}
              onRetry={() => investmentsQuery.refetch()}
            />
          )}

          {/* Holdings Table */}
          {!investmentsQuery.isLoading && !investmentsQuery.isError && investments.length > 0 && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('investmentName')}</TableHead>
                    <TableHead className="text-right">{t('quantity')}</TableHead>
                    <TableHead className="text-right">{t('avgCostPrice')}</TableHead>
                    <TableHead className="text-right">{t('currentPrice')}</TableHead>
                    <TableHead className="text-right">{t('totalValue')}</TableHead>
                    <TableHead className="text-right">{t('gainLoss')}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv: InvestmentHolding) => {
                    const value = inv.currentPrice * inv.quantity
                    const cost = inv.avgCostPrice * inv.quantity
                    const gain = value - cost
                    const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                    const isGain = gain >= 0
                    const catColor =
                      CATEGORY_COLORS[inv.category ?? ''] ?? CATEGORY_COLORS.other

                    return (
                      <TableRow key={inv.id}>
                        {/* Name + Ticker + Category */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {inv.name}
                              </span>
                              {inv.ticker && (
                                <Badge variant="outline" className="text-[10px] uppercase">
                                  {inv.ticker}
                                </Badge>
                              )}
                            </div>
                            {inv.category && (
                              <Badge
                                className={cn(
                                  'w-fit text-[10px] capitalize border-0',
                                  catColor,
                                )}
                              >
                                {inv.category.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-right tabular-nums">
                          {inv.quantity}
                        </TableCell>

                        {/* Avg Cost */}
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(inv.avgCostPrice)}
                        </TableCell>

                        {/* Current Price */}
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(inv.currentPrice)}
                        </TableCell>

                        {/* Value */}
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(value)}
                        </TableCell>

                        {/* Gain / % */}
                        <TableCell className="text-right">
                          <div
                            className={cn(
                              'flex flex-col items-end gap-0.5 tabular-nums',
                              isGain
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400',
                            )}
                          >
                            <span className="text-sm font-medium">
                              {isGain ? '+' : ''}
                              {formatCurrency(gain)}
                            </span>
                            <span className="text-xs">
                              {isGain ? '+' : ''}
                              {gainPct.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>

                        {/* Delete */}
                        <TableCell>
                          <DeleteButton onClick={() => handleDelete(inv)} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Empty State */}
          {!investmentsQuery.isLoading && !investmentsQuery.isError && investments.length === 0 && (
            <EmptyState
              title={t('noInvestments')}
              description={t('noInvestmentsDescription')}
            />
          )}
        </div>
      </div>

      <InvestmentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
    </FeatureGate>
  )
}

function InvestmentDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('finances')
  const createInvestment = useCreateInvestment()

  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [category, setCategory] = useState('stocks')
  const [quantity, setQuantity] = useState('')
  const [avgCostPrice, setAvgCostPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setTicker('')
    setCategory('stocks')
    setQuantity('')
    setAvgCostPrice('')
    setCurrentPrice('')
    setCurrency('USD')
    setNotes('')
  }
  if (open !== prevOpen) setPrevOpen(open)

  const CATEGORIES = [
    { value: 'stocks', label: t('categoryStocks') },
    { value: 'bonds', label: t('categoryBonds') },
    { value: 'etf', label: t('categoryETF') },
    { value: 'crypto', label: t('categoryCrypto') },
    { value: 'real_estate', label: t('categoryRealEstate') },
    { value: 'other', label: t('categoryOther') },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !quantity || !avgCostPrice || !currentPrice) return

    try {
      await createInvestment.mutateAsync({
        name: name.trim(),
        ticker: ticker.trim() || undefined,
        category,
        quantity: parseFloat(quantity),
        avgCostPrice: parseFloat(avgCostPrice),
        currentPrice: parseFloat(currentPrice),
        currency,
        notes: notes.trim() || undefined,
      })
      toast.success(t('investmentCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t('newInvestment')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-6">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>{t('category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label>{t('investmentName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apple Inc."
                autoFocus
              />
            </div>

            {/* Ticker */}
            <div className="space-y-1.5">
              <Label>{t('ticker')}</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="AAPL"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label>{t('quantity')}</Label>
              <Input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
              />
            </div>

            {/* Avg Cost + Current Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('avgCostPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={avgCostPrice}
                  onChange={(e) => setAvgCostPrice(e.target.value)}
                  placeholder="150.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('currentPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="175.00"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <Label>{t('currency')}</Label>
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

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>{t('notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/10 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                !quantity ||
                !avgCostPrice ||
                !currentPrice ||
                createInvestment.isPending
              }
            >
              {t('addInvestment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
