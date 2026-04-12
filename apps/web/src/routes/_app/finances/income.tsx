import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  financesQueries,
  useCreateIncomeSource,
  useDeleteIncomeSource,
} from '../../../features/finances/queries'
import type { IncomeSource } from '../../../features/finances/api'
import { CURRENCY_OPTIONS, INCOME_CATEGORY_OPTIONS } from '../../../features/finances/constants'
import { QueryError } from '../../../components/query-error'
import { PlusIcon } from '../../../components/icons'
import { DeleteButton } from '../../../components/action-buttons'
import { FinancesNav } from '@/features/finances/components/finances-nav'
import { useCurrency } from '@/features/finances/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { useState } from 'react'
import { Briefcase, TrendingUp, DollarSign } from 'lucide-react'

export const Route = createFileRoute('/_app/finances/income')({
  component: IncomePage,
})

function IncomePage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const incomeQuery = useQuery(financesQueries.incomeSources())
  const deleteIncome = useDeleteIncomeSource()
  const [dialogOpen, setDialogOpen] = useState(false)

  const sources = incomeQuery.data?.data ?? []
  const estimatedMonthly = sources.reduce((sum: number, s: IncomeSource) => {
    if (!s.isActive) return sum
    switch (s.frequency) {
      case 'monthly': return sum + s.amount
      case 'annual': return sum + s.amount / 12
      case 'weekly': return sum + s.amount * 4.33
      case 'biweekly': return sum + s.amount * 2.17
      default: return sum + s.amount
    }
  }, 0)

  async function handleDelete(source: IncomeSource) {
    try {
      await deleteIncome.mutateAsync(source.id)
      toast.success(t('incomeDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <FinancesNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{t('myIncomeSources')}</h1>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon /> {t('addIncomeSource')}
            </Button>
          </div>

          {/* Estimated monthly summary card */}
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('estimatedMonthlyIncome')}</p>
                <p className="text-2xl font-bold">{formatCurrency(estimatedMonthly)}</p>
              </div>
            </CardContent>
          </Card>

          {incomeQuery.isLoading && <SkeletonList lines={4} />}
          {incomeQuery.isError && (
            <QueryError message={t('failedToLoad')} onRetry={() => incomeQuery.refetch()} />
          )}

          {!incomeQuery.isLoading && !incomeQuery.isError && sources.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sources.map((source: IncomeSource) => {
                const Icon = source.isVariable ? TrendingUp : Briefcase
                const iconColor = source.isVariable
                  ? 'text-yellow-500 bg-yellow-500/10'
                  : 'text-primary bg-primary/10'

                return (
                  <Card
                    key={source.id}
                    className="group relative transition-colors hover:bg-muted/30"
                  >
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <DeleteButton onClick={() => handleDelete(source)} />
                      </div>

                      <p className="text-sm font-medium text-foreground">{source.name}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {formatCurrency(source.amount)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {source.frequency}
                        </Badge>
                        {source.isVariable && (
                          <Badge className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-0 text-[10px]">
                            {t('variable')}
                          </Badge>
                        )}
                        {!source.isActive && (
                          <Badge variant="outline" className="text-[10px]">
                            {t('inactive')}
                          </Badge>
                        )}
                        {source.category && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {source.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!incomeQuery.isLoading && !incomeQuery.isError && sources.length === 0 && (
            <EmptyState
              title={t('noIncome')}
              description={t('noIncomeDescription')}
            />
          )}
        </div>
      </div>

      <IncomeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}

function IncomeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('finances')
  const createIncome = useCreateIncomeSource()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [category, setCategory] = useState('')
  const [isVariable, setIsVariable] = useState(false)
  const [currency, setCurrency] = useState('USD')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setAmount('')
    setFrequency('monthly')
    setCategory('')
    setIsVariable(false)
    setCurrency('USD')
  }
  if (open !== prevOpen) setPrevOpen(open)

  const FREQUENCY_OPTIONS = [
    { value: 'monthly', label: t('frequencyMonthly') },
    { value: 'annual', label: t('frequencyAnnual') },
    { value: 'weekly', label: t('frequencyWeekly') },
    { value: 'biweekly', label: t('frequencyBiweekly') },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount) return

    try {
      await createIncome.mutateAsync({
        name: name.trim(),
        amount: parseFloat(amount),
        frequency,
        category: category.trim() || undefined,
        isVariable,
        currency,
      })
      toast.success(t('incomeCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t('newIncomeSource')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('addIncomeSource')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <Label>{t('sourceName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('amount')}</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('frequency')}</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('category')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('currency', { ns: 'common' })}</Label>
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
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isVariable" checked={isVariable} onCheckedChange={(v) => setIsVariable(v === true)} />
              <Label htmlFor="isVariable">{t('variable')}</Label>
            </div>
          </div>
          <DialogFooter className="border-t px-6 py-4 bg-muted/10">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!name.trim() || !amount || createIncome.isPending}>{t('addIncomeSource')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
