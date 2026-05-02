import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  useAmbassadorDetail,
  useAmbassadorOwed,
  useAmbassadorTiers,
  useApproveAmbassador,
  useRejectAmbassador,
  useSetAmbassadorTier,
  useSetAmbassadorCommission,
  useSuspendAmbassador,
  useRegisterPayout,
} from '@/features/ambassadors/queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Input,
  Select,
} from '@repo/ui'
import { ArrowLeft } from 'lucide-react'

function formatUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function AmbassadorDetailPage() {
  const { id } = Route.useParams() as { id: string }
  const { data: amb, isLoading } = useAmbassadorDetail(id)
  const { data: owed } = useAmbassadorOwed(id)
  const { data: tiers } = useAmbassadorTiers()

  const approve = useApproveAmbassador()
  const reject = useRejectAmbassador()
  const setTier = useSetAmbassadorTier()
  const setCommission = useSetAmbassadorCommission()
  const suspend = useSuspendAmbassador()
  const registerPayout = useRegisterPayout()

  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [overridePct, setOverridePct] = useState<string>('')
  const [payoutAmount, setPayoutAmount] = useState<string>('')
  const [payoutMethod, setPayoutMethod] = useState<string>('paypal')
  const [payoutRef, setPayoutRef] = useState<string>('')
  const [payoutNotes, setPayoutNotes] = useState<string>('')

  if (isLoading || !amb) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <Link to={'/ambassadors' as any} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{amb.fullName}</CardTitle>
              <CardDescription>
                {amb.user.email} · {amb.country} · Applied {new Date(amb.appliedAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={amb.status === 'APPROVED' ? 'primary' : 'outline'}>{amb.status}</Badge>
              {amb.tier && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: amb.tier.badgeColor ?? '#6366f1' }}
                >
                  {amb.tier.name}
                </span>
              )}
              {amb.referralCode && <code className="font-mono bg-muted px-2 py-1 rounded text-sm">{amb.referralCode}</code>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Info label="Platform" value={`${amb.primaryPlatform} · ${amb.primaryHandle}`} />
          <Info label="Audience size" value={amb.audienceSize?.toLocaleString() ?? '—'} />
          <Info label="Niche" value={amb.niche ?? '—'} />
          <Info label="Phone" value={amb.contactPhone ?? '—'} />
          <Info label="Promo channels" value={amb.promoChannels.join(', ') || '—'} />
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">Motivation</div>
            <p className="text-sm whitespace-pre-wrap">{amb.motivation}</p>
          </div>
          {amb.sampleUrls.length > 0 && (
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Sample URLs</div>
              <ul className="list-disc pl-5 space-y-1">
                {amb.sampleUrls.map((u, i) => (
                  <li key={i}><a href={u} target="_blank" rel="noreferrer" className="text-primary hover:underline">{u}</a></li>
                ))}
              </ul>
            </div>
          )}
          {amb.socialLinks && Object.keys(amb.socialLinks).length > 0 && (
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Socials</div>
              <ul className="text-sm space-y-1">
                {Object.entries(amb.socialLinks).map(([k, v]) => (
                  <li key={k}><span className="font-medium capitalize">{k}:</span> {v}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {amb.status === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>Decision</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              onClick={async () => {
                await approve.mutateAsync(amb.id)
              }}
              disabled={approve.isPending}
            >
              {approve.isPending ? 'Approving...' : 'Approve'}
            </Button>
            <Button variant="outline" onClick={() => setShowRejectModal(true)}>
              Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {showRejectModal && (
        <Card>
          <CardHeader>
            <CardTitle>Reject reason</CardTitle>
            <CardDescription>The reason will be sent to the applicant by email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Brief reason..."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!rejectReason.trim()) return
                  await reject.mutateAsync({ id: amb.id, reason: rejectReason.trim() })
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                disabled={reject.isPending || !rejectReason.trim()}
              >
                Confirm reject
              </Button>
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {amb.status === 'APPROVED' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Tier & Commission</CardTitle>
              <CardDescription>Effective % = override (if set) else tier %.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Select
                  label="Manual tier"
                  value={amb.tierId ?? ''}
                  onChange={(e) => setTier.mutate({ id: amb.id, tierId: e.target.value })}
                  options={(tiers ?? []).map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.commissionPct}% — min ${t.minActiveReferrals} active)`,
                  }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Custom commission % (override)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={overridePct === '' ? amb.customCommissionPct?.toString() ?? '' : overridePct}
                    onChange={(e) => setOverridePct(e.target.value)}
                    placeholder="leave empty to use tier %"
                  />
                  <Button
                    onClick={async () => {
                      const v = overridePct.trim()
                      const pct = v === '' ? null : Number(v)
                      await setCommission.mutateAsync({ id: amb.id, commissionPct: pct })
                      setOverridePct('')
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div>
                <Button variant="outline" onClick={() => suspend.mutate(amb.id)} disabled={suspend.isPending}>
                  Suspend ambassador
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
              <CardDescription>
                Owed: <strong>{formatUSD(owed?.amountCents ?? 0)}</strong> ({owed?.commissionsCount ?? 0} approved commissions)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  type="number"
                  placeholder="Amount (USD)"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
                <Select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  options={[
                    { value: 'paypal', label: 'PayPal' },
                    { value: 'wise', label: 'Wise' },
                    { value: 'bank', label: 'Bank' },
                    { value: 'manual', label: 'Manual' },
                  ]}
                />
                <Input placeholder="Tx ref (optional)" value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} />
                <Input placeholder="Notes" value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} />
              </div>
              <Button
                disabled={!payoutAmount || registerPayout.isPending}
                onClick={async () => {
                  const dollars = Number(payoutAmount)
                  if (!Number.isFinite(dollars) || dollars <= 0) return
                  await registerPayout.mutateAsync({
                    id: amb.id,
                    amountCents: Math.round(dollars * 100),
                    method: payoutMethod,
                    externalRef: payoutRef || undefined,
                    notes: payoutNotes || undefined,
                  })
                  setPayoutAmount('')
                  setPayoutRef('')
                  setPayoutNotes('')
                }}
              >
                Register payout
              </Button>

              {amb.payouts.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Payout history</h4>
                  <ul className="text-sm space-y-1">
                    {amb.payouts.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>{new Date(p.paidAt).toLocaleDateString()} · {p.method} {p.externalRef && `(${p.externalRef})`}</span>
                        <span className="font-medium">{formatUSD(p.amountCents)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referrals ({amb.referrals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {amb.referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referrals yet.</p>
              ) : (
                <ul className="text-sm divide-y">
                  {amb.referrals.map((r) => (
                    <li key={r.id} className="flex justify-between py-2">
                      <span>{r.referredUser.email}</span>
                      <div className="flex gap-2 items-center">
                        <Badge variant={r.status === 'ACTIVE' ? 'primary' : 'outline'}>{r.status}</Badge>
                        <span className="text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {amb.status === 'REJECTED' && amb.rejectionReason && (
        <Card>
          <CardHeader>
            <CardTitle>Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{amb.rejectionReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

export const Route = createFileRoute('/_admin/ambassadors/$id' as any)({
  component: AmbassadorDetailPage,
})
