import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  Plus,
  MoreHorizontal,
  Copy,
  Building,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  financesQueries,
  useCreateAccount,
  useDeleteAccount,
} from '@/features/finances/queries'
import { CURRENCY_OPTIONS } from '../../../features/finances/constants'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FinanceAccount } from '@repo/shared/types'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/upgrade-prompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/finances/accounts')({
  component: AccountsPage,
})

const ACCOUNT_COLORS: Record<string, string> = {
  checking: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  savings: 'bg-green-500/10 text-green-600 dark:text-green-400',
  credit_card: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  investment: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  cash: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  loan: 'bg-red-500/10 text-red-600 dark:text-red-400',
  other: 'bg-muted text-muted-foreground',
}

function AccountsPage() {
  const { t } = useTranslation('finances')
  const { formatCurrency } = useCurrency()
  const accountsQuery = useQuery(financesQueries.accounts())
  const deleteAccount = useDeleteAccount()
  const [dialogOpen, setDialogOpen] = useState(false)

  const accounts = accountsQuery.data?.data ?? []
  const totalBalance = accounts.reduce(
    (sum: number, a: FinanceAccount) => sum + a.currentBalance,
    0,
  )

  async function handleDelete(account: FinanceAccount) {
    try {
      await deleteAccount.mutateAsync(account.id)
      toast.success(t('accountDeleted'))
    } catch {
      toast.error(t('failedToDeleteAccount'))
    }
  }

  function handleCopyNumber(value: string) {
    navigator.clipboard.writeText(value)
    toast.success(t('copied'))
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
                {t('myAccounts')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('totalLabel')} {formatCurrency(totalBalance)}
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addAccount')}
            </Button>
          </div>

          {accountsQuery.isLoading && <SkeletonList lines={4} />}

          {!accountsQuery.isLoading && accounts.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account: FinanceAccount) => {
                const colorClass =
                  ACCOUNT_COLORS[account.type] || ACCOUNT_COLORS.other
                const isNegative =
                  account.type === 'credit_card'
                    ? account.currentBalance > 0
                    : account.currentBalance < 0

                return (
                  <Card
                    key={account.id}
                    className="group relative transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/20"
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}
                          >
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {account.name}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize"
                            >
                              {account.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleCopyNumber(account.id)
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {t('copyId')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(account)}
                            >
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Balance */}
                      <div className="mt-4">
                        <p
                          className={`text-2xl font-bold tracking-tight ${
                            isNegative ? 'text-red-500' : 'text-green-500'
                          }`}
                        >
                          {formatCurrency(
                            account.currentBalance,
                            account.currency,
                          )}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t('currentBalance')}
                        </p>
                      </div>

                      {/* Bank name */}
                      {(account as any).bankName && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-[10px]">
                            {(account as any).bankName}
                          </Badge>
                        </div>
                      )}

                      {/* Inactive overlay */}
                      {!account.isActive && (
                        <Badge
                          variant="outline"
                          className="absolute right-3 top-3 text-[10px] text-muted-foreground"
                        >
                          {t('inactive')}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!accountsQuery.isLoading && accounts.length === 0 && (
            <EmptyState
              title={t('noAccounts')}
              description={t('noAccountsDescription')}
            />
          )}
        </div>
      </div>

      <AccountDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
    </FeatureGate>
  )
}

function AccountDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('finances')
  const createAccount = useCreateAccount()

  const [name, setName] = useState('')
  const [type, setType] = useState('checking')
  const [bankName, setBankName] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setName('')
    setType('checking')
    setBankName('')
    setInitialBalance('')
    setCurrency('USD')
  }
  if (open !== prevOpen) setPrevOpen(open)

  const ACCOUNT_TYPES = [
    { value: 'checking', label: t('typeChecking') },
    { value: 'savings', label: t('typeSavings') },
    { value: 'credit_card', label: t('typeCreditCard') },
    { value: 'investment', label: t('typeInvestment') },
    { value: 'cash', label: t('typeCash') },
    { value: 'other', label: t('typeOther') },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createAccount.mutateAsync({
        name: name.trim(),
        type: type as any,
        bankName: bankName.trim() || undefined,
        initialBalance: parseFloat(initialBalance) || 0,
        currency,
      })
      toast.success(t('accountCreated'))
      onClose()
    } catch {
      toast.error(t('failedToCreateAccount'))
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
            <DialogTitle>{t('newAccount')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <Label>{t('accountName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('accountNamePlaceholder')}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('accountType')}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('bankName')}</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder={t('bankNamePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('initialBalance')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                />
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
              disabled={!name.trim() || createAccount.isPending}
            >
              {t('createAccount')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
