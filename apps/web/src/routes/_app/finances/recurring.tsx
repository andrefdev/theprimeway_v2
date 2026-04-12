import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  financesQueries,
  useCreateRecurringExpense,
  useDeleteRecurringExpense,
} from '../../../features/finances/queries'
import type { RecurringExpense } from '../../../features/finances/api'
import { CURRENCY_OPTIONS, EXPENSE_CATEGORY_OPTIONS } from '../../../features/finances/constants'
import { QueryError } from '../../../components/query-error'
import { PlusIcon } from '../../../components/Icons'
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
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Home,
  Zap,
  CreditCard,
  Car,
  UtensilsCrossed,
  ShieldCheck,
  Heart,
  GraduationCap,
  Dumbbell,
  Receipt,
  CalendarClock,
  DollarSign,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/finances/recurring')({
  component: RecurringPage,
})

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  housing: { icon: Home, color: 'text-blue-500 bg-blue-500/10' },
  utilities: { icon: Zap, color: 'text-yellow-500 bg-yellow-500/10' },
  subscriptions: { icon: CreditCard, color: 'text-purple-500 bg-purple-500/10' },
  transport: { icon: Car, color: 'text-cyan-500 bg-cyan-500/10' },
  transportation: { icon: Car, color: 'text-cyan-500 bg-cyan-500/10' },
  food: { icon: UtensilsCrossed, color: 'text-orange-500 bg-orange-500/10' },
  insurance: { icon: ShieldCheck, color: 'text-green-500 bg-green-500/10' },
  health: { icon: Heart, color: 'text-red-400 bg-red-400/10' },
  education: { icon: GraduationCap, color: 'text-indigo-500 bg-indigo-500/10' },
  fitness: { icon: Dumbbell, color: 'text-pink-500 bg-pink-500/10' },
}

function getCategoryIcon(category?: string | null) {
  const key = (category ?? '').toLowerCase()
  return CATEGORY_ICONS[key] ?? { icon: Receipt, color: 'text-muted-foreground bg-muted' }
}

function RecurringPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const recurringQuery = useQuery(financesQueries.recurringExpenses())
  const deleteRecurring = useDeleteRecurringExpense()
  const [dialogOpen, setDialogOpen] = useState(false)

  const expenses = recurringQuery.data?.data ?? []

  const fixedExpenses = expenses.filter(
    (e: RecurringExpense) => e.type !== 'variable' && e.isActive
  )
  const variableExpenses = expenses.filter(
    (e: RecurringExpense) => e.type === 'variable' && e.isActive
  )

  const totalFixed = fixedExpenses.reduce(
    (sum: number, e: RecurringExpense) => sum + e.amount,
    0
  )
  const totalVariable = variableExpenses.reduce(
    (sum: number, e: RecurringExpense) => sum + e.amount,
    0
  )

  async function handleDelete(expense: RecurringExpense) {
    try {
      await deleteRecurring.mutateAsync(expense.id)
      toast.success(t('recurringDeleted'))
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
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{t('myRecurringExpenses')}</h1>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon /> {t('addRecurringExpense')}
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <DollarSign className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalFixed')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalFixed)}</p>
                  <p className="text-xs text-muted-foreground">/ {t('frequencyMonthly').toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                  <DollarSign className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalVariable')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalVariable)}</p>
                  <p className="text-xs text-muted-foreground">/ {t('frequencyMonthly').toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {recurringQuery.isLoading && <SkeletonList lines={4} />}
          {recurringQuery.isError && (
            <QueryError message={t('failedToLoad')} onRetry={() => recurringQuery.refetch()} />
          )}

          {!recurringQuery.isLoading && !recurringQuery.isError && expenses.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expenses.map((expense: RecurringExpense) => {
                const { icon: Icon, color } = getCategoryIcon(expense.category)

                return (
                  <Card
                    key={expense.id}
                    className="group relative transition-colors hover:bg-muted/30"
                  >
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <DeleteButton onClick={() => handleDelete(expense)} />
                      </div>

                      <p className="text-sm font-medium text-foreground">{expense.name}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {formatCurrency(expense.amount)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {expense.frequency}
                        </Badge>
                        {expense.dueDay && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {t('dueDay')} {expense.dueDay}
                          </Badge>
                        )}
                        {expense.isAutoPay && (
                          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-0 text-[10px]">
                            Auto
                          </Badge>
                        )}
                        {!expense.isActive && (
                          <Badge variant="outline" className="text-[10px]">
                            {t('inactive', { ns: 'common' })}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!recurringQuery.isLoading && !recurringQuery.isError && expenses.length === 0 && (
            <EmptyState
              title={t('noRecurring')}
              description={t('noRecurringDescription')}
            />
          )}
        </div>
      </div>

      <RecurringDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
    </FeatureGate>
  )
}

function RecurringDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('finances')
  const createRecurring = useCreateRecurringExpense()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [dueDay, setDueDay] = useState('')
  const [isAutoPay, setIsAutoPay] = useState(false)
  const [category, setCategory] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setAmount('')
    setFrequency('monthly')
    setDueDay('')
    setIsAutoPay(false)
    setCategory('')
    setCurrency('USD')
  }
  if (open !== prevOpen) setPrevOpen(open)

  const FREQUENCY_OPTIONS = [
    { value: 'monthly', label: t('frequencyMonthly') },
    { value: 'weekly', label: t('frequencyWeekly') },
    { value: 'daily', label: t('frequencyDaily') },
    { value: 'annual', label: t('frequencyAnnual') },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount) return

    try {
      await createRecurring.mutateAsync({
        name: name.trim(),
        amount: parseFloat(amount),
        frequency,
        dueDay: dueDay ? parseInt(dueDay, 10) : undefined,
        isAutoPay,
        category: category.trim() || undefined,
        currency,
      })
      toast.success(t('recurringCreated'))
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
            <DialogTitle>{t('newRecurring')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('addRecurringExpense')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <Label>{t('expenseName')}</Label>
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
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('dueDay')}</Label>
                <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('category', { ns: 'common' })}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="flex items-center gap-2">
              <Checkbox id="autoPay" checked={isAutoPay} onCheckedChange={(v) => setIsAutoPay(v === true)} />
              <Label htmlFor="autoPay">{t('autoPay')}</Label>
            </div>
          </div>
          <DialogFooter className="border-t px-6 py-4 bg-muted/10">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!name.trim() || !amount || createRecurring.isPending}>{t('addRecurringExpense')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
