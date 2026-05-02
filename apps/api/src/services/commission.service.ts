import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'
import { ambassadorService } from './ambassador.service'

function periodKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

class CommissionService {
  /**
   * Run monthly commission accrual for the given period (default = current month).
   * For each active subscription whose user was referred by an ambassador,
   * upsert a Commission row idempotently keyed by (referralId, periodMonth).
   *
   * NOTE: This MVP uses the subscription plan price as the gross amount.
   * Future: replace with actual paid invoice amount from LemonSqueezy webhook payload.
   */
  async runMonthlyJob(period?: string): Promise<{ created: number; skipped: number }> {
    const targetPeriod = period ?? periodKey(new Date())
    let created = 0
    let skipped = 0

    const referrals = await prisma.referral.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: {
        ambassador: { include: { tier: true } },
        referredUser: {
          include: {
            subscriptions: {
              where: { status: { in: ['active', 'trialing'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        },
      },
    })

    for (const referral of referrals) {
      const sub = referral.referredUser.subscriptions[0]
      if (!sub || !sub.plan) {
        skipped++
        continue
      }
      // Trial users don't generate commission
      if (sub.status !== 'active') {
        skipped++
        continue
      }
      const grossAmountCents = Math.round(Number(sub.plan.price) * 100)
      if (grossAmountCents <= 0) {
        skipped++
        continue
      }
      const pct = Number(referral.ambassador.customCommissionPct ?? referral.ambassador.tier?.commissionPct ?? 20)
      const amountCents = Math.round((grossAmountCents * pct) / 100)

      const existing = await prisma.commission.findUnique({
        where: { referralId_periodMonth: { referralId: referral.id, periodMonth: targetPeriod } },
      })
      if (existing) {
        skipped++
        continue
      }
      await prisma.commission.create({
        data: {
          ambassadorId: referral.ambassadorId,
          referralId: referral.id,
          periodMonth: targetPeriod,
          subscriptionId: sub.id,
          grossAmountCents,
          commissionPct: new Prisma.Decimal(pct),
          amountCents,
          status: 'APPROVED',
        },
      })
      created++
    }

    return { created, skipped }
  }

  /**
   * Called from LemonSqueezy webhook handler when a subscription payment succeeds.
   * Marks the related Referral as ACTIVE + sets firstPaidAt + recomputes tier.
   */
  async onSubscriptionPaymentSuccess(referredUserId: string) {
    const user = await prisma.user.findUnique({ where: { id: referredUserId }, select: { id: true, referredByAmbassadorId: true } })
    if (!user || !user.referredByAmbassadorId) return
    const referral = await prisma.referral.findUnique({ where: { referredUserId }, include: { ambassador: { select: { userId: true } } } })
    if (!referral) return
    const wasNotActive = referral.status !== 'ACTIVE'
    const data: Prisma.ReferralUpdateInput = { status: 'ACTIVE' }
    if (!referral.firstPaidAt) data.firstPaidAt = new Date()
    await prisma.referral.update({ where: { id: referral.id }, data })
    await ambassadorService.maybeUpgradeTier(referral.ambassadorId)

    // Gamification: award XP to ambassador on first paid referral activation
    if (wasNotActive) {
      try {
        const { gamificationService } = await import('./gamification.service')
        await gamificationService.awardXp(referral.ambassador.userId, {
          source: 'ambassador_referral',
          sourceId: referral.id,
          amount: 100,
          metadata: { referralId: referral.id },
        })
      } catch (e) {
        console.error('[AMBASSADOR_XP]', e)
      }
    }
  }

  async onSubscriptionCancelled(referredUserId: string) {
    const referral = await prisma.referral.findUnique({ where: { referredUserId } })
    if (!referral) return
    await prisma.referral.update({ where: { id: referral.id }, data: { status: 'CHURNED', churnedAt: new Date() } })
    await ambassadorService.maybeUpgradeTier(referral.ambassadorId)
  }
}

export const commissionService = new CommissionService()
