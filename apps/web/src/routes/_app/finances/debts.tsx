import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  financesQueries,
  useCreateDebt,
  useDeleteDebt,
} from '@/features/finances/queries'
import type { Debt } from '@/features/finances/api'
import { CURRENCY_OPTIONS } from '@/features/finances/constants'
import { FinancesNav } from '@/features/finances/components/FinancesNav'
import { useCurrency } from '@/features/finances/hooks/use-currency'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { FEATURES } from '@repo/shared/constants'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import { Progress } from '@/shared/components/ui/progress'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

export const Route = createFileRoute('/_app/finances/debts')({
  component: DebtsPage,
})

function DebtsPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const debtsQuery = useQuery(financesQueries.debts())
  const deleteDebt = useDeleteDebt()
  const [dialogOpen, setDialogOpen] = useState(false)

  const debts = debtsQuery.data?.data ?? []
  const totalRemaining = debts.reduce(
    (sum: number, d: Debt) => sum + (d.totalAmount - d.paidAmount),
    0,
  )

  async function handleDelete(debt: Debt) {
    try {
      await deleteDebt.mutateAsync(debt.id)
      toast.success(t('debtDeleted'))
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('myDebts')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('totalRemaining')}{' '}
                <span className="font-semibold text-destructive">
                  {formatCurrency(totalRemaining)}
                </span>
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addDebt')}
            </Button>
          </div>

          {debtsQuery.isLoading && <SkeletonList lines={4} />}

          {!debtsQuery.isLoading && debts.length > 0 && (
            <div className="space-y-4">
              {debts.map((debt: Debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  formatCurrency={formatCurrency}
                  onDelete={() => handleDelete(debt)}
                  t={t}
                />
              ))}
            </div>
          )}

          {!debtsQuery.isLoading && debts.length === 0 && (
            <EmptyState
              title={t('noDebts')}
              description={t('noDebtsDescription')}
            />
          )}
        </div>
      </div>

      <DebtDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
    </FeatureGate>
  )
}

function DebtCard({
  debt,
  formatCurrency,
  onDelete,
  t,
}: {
  debt: Debt
  formatCurrency: (amount: number, currency?: string) => string
  onDelete: () => void
  t: (key: string) => string
}) {
  const { locale } = useLocale()
  const [expanded, setExpanded] = useState(false)

  const remaining = debt.totalAmount - debt.paidAmount
  const progressPercent =
    debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0

  const totalWithInterest =
    debt.interestRate && debt.interestRate > 0
      ? debt.totalAmount * (1 + debt.interestRate / 100)
      : debt.totalAmount

  // Due date status
  let dueStatus: 'overdue' | 'soon' | 'future' | null = null
  if (debt.dueDate) {
    const due = new Date(debt.dueDate)
    const now = new Date()
    const daysUntil = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysUntil < 0) dueStatus = 'overdue'
    else if (daysUntil <= 7) dueStatus = 'soon'
    else dueStatus = 'future'
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{debt.name}</p>
            {debt.debtType && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {debt.debtType.replace('_', ' ')}
              </Badge>
            )}
            {dueStatus === 'overdue' && (
              <Badge variant="destructive" className="text-[10px]">
                {t('overdue')}
              </Badge>
            )}
            {dueStatus === 'soon' && (
              <Badge variant="secondary" className="text-[10px]">
                {t('dueSoon')}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{t('makePayment')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main content row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(debt.totalAmount, debt.currency)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('totalAmount')}
            </p>
          </div>

          {debt.dueDate && (
            <div className="max-w-[180px] rounded-lg border bg-card px-3 py-2 shadow-sm">
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(remaining, debt.currency)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t('remaining')} &middot;{' '}
                {formatDate(debt.dueDate, locale)}
              </p>
            </div>
          )}

          {!debt.dueDate && (
            <div>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(remaining, debt.currency)}
              </p>
              <p className="text-[10px] text-muted-foreground text-right">
                {t('remaining')}
              </p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('progress')}
            </p>
            <p className="text-xs text-muted-foreground">
              {progressPercent.toFixed(0)}%
            </p>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-8 w-full text-xs text-muted-foreground hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" /> {t('viewLess')}
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" /> {t('viewMore')}
            </>
          )}
        </Button>

        {/* Expanded details */}
        {expanded && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-2 grid grid-cols-2 gap-4 border-t pt-3">
            <div className="border-r pr-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('remaining')}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(remaining, debt.currency)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('installments')}
              </p>
              <p className="text-lg font-semibold">
                {debt.installmentCount ?? '—'}
              </p>
            </div>
            <div className="border-r pr-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('interestRate')}
              </p>
              <p className="text-lg font-semibold">
                {debt.interestRate ? `${debt.interestRate}%` : '—'}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('totalWithInterest')}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalWithInterest, debt.currency)}
              </p>
            </div>
            {debt.creditor && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('creditor')}
                </p>
                <p className="text-sm italic">{debt.creditor}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DebtDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('finances')
  const createDebt = useCreateDebt()

  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [creditor, setCreditor] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [debtType, setDebtType] = useState('personal_loan')
  const [currency, setCurrency] = useState('USD')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setTotalAmount('')
    setCreditor('')
    setInterestRate('')
    setDueDate('')
    setDebtType('personal_loan')
    setCurrency('USD')
  }
  if (open !== prevOpen) setPrevOpen(open)

  const DEBT_TYPES = [
    { value: 'personal_loan', label: t('typePersonalLoan') },
    { value: 'credit_card', label: t('typeCreditCard') },
    { value: 'mortgage', label: t('typeMortgage') },
    { value: 'student_loan', label: t('typeStudentLoan') },
    { value: 'auto_loan', label: t('typeAutoLoan') },
    { value: 'other', label: t('typeOther') },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !totalAmount) return

    try {
      await createDebt.mutateAsync({
        name: name.trim(),
        totalAmount: parseFloat(totalAmount),
        creditor: creditor.trim() || undefined,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        dueDate: dueDate || undefined,
        debtType,
        currency,
      })
      toast.success(t('debtCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t('newDebt')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <Label>{t('debtName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('totalAmount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('creditor')}</Label>
                <Input
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('interestRate')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('dueDate')}</Label>
                <DatePicker
                  date={dueDate ? new Date(dueDate + 'T00:00:00') : undefined}
                  onDateChange={(d) => setDueDate(d ? d.toISOString().split('T')[0]! : '')}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('debtType')}</Label>
                <Select value={debtType} onValueChange={setDebtType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEBT_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/10 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() || !totalAmount || createDebt.isPending
              }
            >
              {t('addDebt')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
