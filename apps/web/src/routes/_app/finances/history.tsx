import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  financesQueries,
  useCreateTransaction,
  useDeleteTransaction,
} from '../../../features/finances/queries'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { EXPENSE_CATEGORY_OPTIONS } from '../../../features/finances/constants'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { useState, useRef } from 'react'
import { financesApi } from '../../../features/finances/api'
import { useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Loader2Icon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transaction, FinanceAccount } from '@repo/shared/types'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/upgrade-prompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/finances/history')({
  component: TransactionHistoryPage,
})

// --- Helpers ---

const TX_TYPE_ICON = {
  income: { icon: TrendingUp, bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  expense: { icon: TrendingDown, bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  transfer: { icon: ArrowRightLeft, bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
} as const

function TransactionIcon({ type }: { type: string }) {
  const config = TX_TYPE_ICON[type as keyof typeof TX_TYPE_ICON] ?? TX_TYPE_ICON.expense
  const Icon = config.icon
  return (
    <FeatureGate
      feature={FEATURES.FINANCES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.FINANCES_MODULE} />}
    >
    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.bg)}>
      <Icon className={cn('h-4 w-4', config.text)} />
    </div>
    </FeatureGate>
  )
}

// --- Main page ---

function TransactionHistoryPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const TYPE_TABS = [
    { value: '', label: t('allTypes') },
    { value: 'income', label: t('typeIncome') },
    { value: 'expense', label: t('typeExpense') },
    { value: 'transfer', label: t('typeTransfer') },
  ]

  const params: Record<string, string> = { limit: '50' }
  if (typeFilter) params.type = typeFilter
  if (search) params.search = search

  const txQuery = useQuery(financesQueries.transactions(params))
  const accountsQuery = useQuery(financesQueries.accounts())
  const deleteTransaction = useDeleteTransaction()

  const transactions = txQuery.data?.data ?? []
  const accounts = accountsQuery.data?.data ?? []

  function getAccountName(accountId: string) {
    const acc = accounts.find((a: FinanceAccount) => a.id === accountId)
    return acc?.name ?? 'Unknown'
  }

  async function handleDelete(tx: Transaction) {
    try {
      await deleteTransaction.mutateAsync(tx.id)
      toast.success(t('transactionDeleted'))
    } catch {
      toast.error(t('failedToDeleteTransaction'))
    }
  }

  function formatAmount(tx: Transaction) {
    const abs = formatCurrency(Math.abs(tx.amount))
    if (tx.type === 'income') return `+${abs}`
    if (tx.type === 'transfer') return abs
    return `-${abs}`
  }

  function amountColor(type: string) {
    if (type === 'income') return 'text-emerald-600 dark:text-emerald-400'
    if (type === 'transfer') return 'text-blue-600 dark:text-blue-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="flex h-full flex-col">
      <FinancesNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{t('transactions')}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                {t('importTransactions')}
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusIcon /> {t('addTransaction')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Type filter tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTypeFilter(tab.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    typeFilter === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input with icon overlay */}
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchTransactions')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Loading / Error */}
          {txQuery.isLoading && <SkeletonList lines={8} />}
          {txQuery.isError && (
            <QueryError
              message={t('failedToLoadTransactions')}
              onRetry={() => txQuery.refetch()}
            />
          )}

          {/* Transaction list */}
          {!txQuery.isLoading && !txQuery.isError && transactions.length > 0 && (
            <div className="space-y-2">
              {transactions.map((tx: Transaction) => (
                <Card key={tx.id} className="group transition-colors hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    {/* Left: icon + details */}
                    <div className="flex min-w-0 items-center gap-3">
                      <TransactionIcon type={tx.type} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {tx.description || tx.category || t('transactions')}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {tx.category && (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {tx.category}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {getAccountName(tx.accountId)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: amount + delete */}
                    <div className="flex shrink-0 items-center gap-3">
                      <p className={cn('text-sm font-bold tabular-nums', amountColor(tx.type))}>
                        {formatAmount(tx)}
                      </p>
                      <DeleteButton onClick={() => handleDelete(tx)} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!txQuery.isLoading && !txQuery.isError && transactions.length === 0 && (
            <EmptyState
              title={search || typeFilter ? t('noMatchingTransactions') : t('noTransactions')}
              description={search || typeFilter ? t('tryFilters') : t('recordFirst')}
            />
          )}
        </div>
      </div>

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        accounts={accounts}
      />

      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        accounts={accounts}
      />
    </div>
  )
}

// --- Create Transaction Dialog ---

const TYPE_CARDS = [
  {
    value: 'expense',
    icon: TrendingDown,
    borderActive: 'border-red-500',
    bgActive: 'bg-red-500/10',
    textActive: 'text-red-600 dark:text-red-400',
  },
  {
    value: 'income',
    icon: TrendingUp,
    borderActive: 'border-emerald-500',
    bgActive: 'bg-emerald-500/10',
    textActive: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'transfer',
    icon: ArrowRightLeft,
    borderActive: 'border-blue-500',
    bgActive: 'bg-blue-500/10',
    textActive: 'text-blue-600 dark:text-blue-400',
  },
] as const

function TransactionDialog({
  open,
  onClose,
  accounts,
}: {
  open: boolean
  onClose: () => void
  accounts: FinanceAccount[]
}) {
  const { t } = useTranslation('finances')
  const createTransaction = useCreateTransaction()

  const [accountId, setAccountId] = useState('')
  const [type, setType] = useState<string>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setAccountId(accounts[0]?.id ?? '')
    setType('expense')
    setAmount('')
    setDescription('')
    setCategory('')
    setDate(new Date().toISOString().split('T')[0])
  }
  if (open !== prevOpen) setPrevOpen(open)

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId || !amount) return

    try {
      await createTransaction.mutateAsync({
        accountId,
        type: type as any,
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        date,
      })
      toast.success(t('transactionRecorded'))
      onClose()
    } catch {
      toast.error(t('failedToCreateTransaction'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{t('newTransaction')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('newTransaction')}
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <div className="space-y-4 px-6 py-6">
            {/* Type selector — 3-column grid */}
            <div>
              <Label className="mb-2 block">{t('accountType')}</Label>
              <div className="grid grid-cols-3 gap-3">
                {TYPE_CARDS.map((card) => {
                  const Icon = card.icon
                  const active = type === card.value
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => setType(card.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-colors',
                        active
                          ? `${card.borderActive} ${card.bgActive} ${card.textActive}`
                          : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/50',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {t(`type${card.value.charAt(0).toUpperCase()}${card.value.slice(1)}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Amount input — large */}
            <div className="space-y-1.5">
              <Label>{t('amount')}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('amountPlaceholder')}
                className="h-14 font-mono text-lg font-semibold"
                autoFocus
              />
            </div>

            {/* Account */}
            <div className="space-y-1.5">
              <Label>{t('navAccounts')}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>{t('description')}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {/* Category + Date side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('category')}</Label>
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
              <div className="space-y-1.5">
                <Label>{t('date')}</Label>
                <DatePicker
                  date={date ? new Date(date + 'T00:00:00') : undefined}
                  onDateChange={(d) => setDate(d ? d.toISOString().split('T')[0]! : '')}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t px-6 py-4 bg-muted/10">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={!accountId || !amount || createTransaction.isPending}
            >
              {createTransaction.isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('addTransactionButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Import Dialog (unchanged) ---

function ImportDialog({
  open,
  onClose,
  accounts,
}: {
  open: boolean
  onClose: () => void
  accounts: FinanceAccount[]
}) {
  const { t } = useTranslation('finances')
  const queryClient = useQueryClient()

  const [accountId, setAccountId] = useState('')
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<
    Array<{
      description: string
      amount: number
      type: string
      date: string
      category?: string
    }>
  >([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setAccountId(accounts[0]?.id ?? '')
    setPreview([])
    setImporting(false)
  }
  if (open !== prevOpen) setPrevOpen(open)

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }))

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      if (lines.length < 2) return

      // Parse CSV: expect columns date, description, amount, category (optional), type (optional)
      const rows = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
          const amount = parseFloat(cols[2] ?? '0')
          return {
            date: cols[0] ?? new Date().toISOString().split('T')[0]!,
            description: cols[1] ?? '',
            amount: Math.abs(amount),
            type: cols[4] ?? (amount >= 0 ? 'income' : 'expense'),
            category: cols[3] || undefined,
          }
        })
        .filter((r) => r.description && r.amount > 0)

      setPreview(rows)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!accountId || preview.length === 0) return
    setImporting(true)
    try {
      await financesApi.importBatch({
        accountId,
        transactions: preview.map((r) => ({
          accountId,
          ...r,
        })),
      })
      queryClient.invalidateQueries({ queryKey: financesQueries.all() })
      toast.success(t('importSuccess', { count: preview.length }))
      onClose()
    } catch {
      toast.error(t('failedToImport'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('importTransactions')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('importTransactions')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>{t('navAccounts')}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t('csvFile')}
            </label>
            <p className="mb-2 text-xs text-muted-foreground">{t('csvFormat')}</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-border file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                {t('previewCount', { count: preview.length })}
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {preview.slice(0, 10).map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs"
                  >
                    <div>
                      <span className="text-foreground">{row.description}</span>
                      <span className="ml-2 text-muted-foreground">{row.date}</span>
                    </div>
                    <span
                      className={
                        row.type === 'income' ? 'text-success' : 'text-destructive'
                      }
                    >
                      {row.type === 'income' ? '+' : '-'}
                      {row.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {preview.length > 10 && (
                  <p className="py-1 text-center text-xs text-muted-foreground">
                    ...{t('andMore', { count: preview.length - 10 })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!accountId || preview.length === 0 || importing}
          >
            {t('importCount', { count: preview.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
