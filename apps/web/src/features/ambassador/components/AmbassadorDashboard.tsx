import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Copy, TrendingUp, Users, DollarSign, Wallet, Sparkles, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useAmbassadorDashboard, useAmbassadorReferrals, useAmbassadorCommissions, useAmbassadorMe, useSetPayoutMethod } from '../queries'

function formatUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function AmbassadorDashboard() {
  const { t } = useTranslation('ambassador')
  const dash = useAmbassadorDashboard()
  const referrals = useAmbassadorReferrals(0, 50)
  const commissions = useAmbassadorCommissions(0, 100)
  const me = useAmbassadorMe()
  const setPayout = useSetPayoutMethod()

  const [payoutMethodInput, setPayoutMethodInput] = useState<string>(me.data?.payoutMethod ?? 'paypal')
  const [payoutEmail, setPayoutEmail] = useState<string>((me.data?.payoutDetails as any)?.email ?? '')

  if (dash.isLoading || !dash.data) {
    return <Skeleton className="h-96 w-full" />
  }

  const d = dash.data
  const link = `${window.location.origin}/?ref=${d.referralCode}`
  const tierProgress = d.nextTier
    ? Math.min(100, (d.totals.activeReferrals / d.nextTier.minActiveReferrals) * 100)
    : 100

  function copy(value: string) {
    navigator.clipboard.writeText(value)
    toast.success(t('copied'))
  }

  async function savePayout() {
    try {
      await setPayout.mutateAsync({ method: payoutMethodInput, details: { email: payoutEmail } })
      toast.success(t('dashboard.payoutMethod.saved'))
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Error')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-indigo-500" />
        <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
      </div>

      {/* Tier hero */}
      <Card className="overflow-hidden">
        <div
          className="p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${d.tier?.badgeColor ?? '#6366f1'} 0%, ${d.nextTier?.badgeColor ?? '#a855f7'} 100%)`,
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                <Trophy className="h-4 w-4" />
                <span>{t('dashboard.tier')}</span>
              </div>
              <div className="text-3xl font-bold">{d.tier?.name ?? '—'}</div>
              <div className="text-sm opacity-90 mt-1">
                {d.effectiveCommissionPct}% {t('dashboard.commission').toLowerCase()}
              </div>
            </div>
            {d.nextTier && (
              <div className="min-w-[260px]">
                <div className="flex justify-between text-xs mb-1">
                  <span>{t('dashboard.progressTo', { tier: d.nextTier.name })}</span>
                  <span>{d.totals.activeReferrals}/{d.nextTier.minActiveReferrals}</span>
                </div>
                <Progress value={tierProgress} className="bg-white/30" />
                <div className="text-xs opacity-80 mt-1">
                  +{Math.max(0, d.nextTier.minActiveReferrals - d.totals.activeReferrals)} active referrals
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Code + link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('approved.code')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <code className="text-2xl font-mono font-bold text-indigo-600">{d.referralCode}</code>
              <Button variant="ghost" size="sm" onClick={() => copy(d.referralCode!)}><Copy className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('approved.link')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm truncate">{link}</code>
              <Button variant="ghost" size="sm" onClick={() => copy(link)}><Copy className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-4 w-4" />} label={t('dashboard.totalReferrals')} value={String(d.totals.totalReferrals)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={t('dashboard.activeReferrals')} value={String(d.totals.activeReferrals)} />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label={t('dashboard.accrued')} value={formatUSD(d.totals.accruedCents)} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label={t('dashboard.owed')} value={formatUSD(d.totals.owedCents)} accent />
      </div>

      {/* Payout method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.payoutMethod.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>{t('dashboard.payoutMethod.method')}</Label>
              <Select value={payoutMethodInput} onValueChange={setPayoutMethodInput}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="wise">Wise</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('dashboard.payoutMethod.details')}</Label>
              <Input value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="flex items-end">
              <Button onClick={savePayout} disabled={setPayout.isPending}>{t('dashboard.payoutMethod.save')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.recentReferrals')}</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.data && referrals.data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('dashboard.noReferralsYet')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t('dashboard.status')}</TableHead>
                  <TableHead>Signup</TableHead>
                  <TableHead>First paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(referrals.data ?? []).map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Badge variant={r.status === 'ACTIVE' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{r.firstPaidAt ? new Date(r.firstPaidAt).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commissions history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.commissionsHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.data && commissions.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.period')}</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>{t('dashboard.amount')}</TableHead>
                  <TableHead>{t('dashboard.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.periodMonth}</TableCell>
                    <TableCell>{Number(c.commissionPct)}%</TableCell>
                    <TableCell>{formatUSD(c.amountCents)}</TableCell>
                    <TableCell><Badge variant={c.status === 'PAID' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">—</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}
