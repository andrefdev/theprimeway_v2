import { prisma } from '../lib/prisma'
import { Prisma, type AmbassadorPlatform, type AmbassadorStatus } from '@prisma/client'
import { generateReferralCode } from './referral-code.service'
import { notificationsRepo } from '../repositories/notifications.repo'
import { emailService } from './email.service'

const DEFAULT_TIERS: Array<{ name: string; order: number; minActiveReferrals: number; commissionPct: number; perks: string[]; badgeColor: string }> = [
  { name: 'Bronze', order: 1, minActiveReferrals: 0, commissionPct: 20, perks: ['20% comisión recurrente', 'Código de referido personalizado'], badgeColor: '#cd7f32' },
  { name: 'Silver', order: 2, minActiveReferrals: 11, commissionPct: 22, perks: ['22% comisión', 'Featured ambassador badge'], badgeColor: '#c0c0c0' },
  { name: 'Gold', order: 3, minActiveReferrals: 31, commissionPct: 25, perks: ['25% comisión', 'Co-marketing opportunities', 'Priority support'], badgeColor: '#d4af37' },
  { name: 'Platinum', order: 4, minActiveReferrals: 100, commissionPct: 30, perks: ['30% comisión', 'Dedicated account manager', 'Custom partnership terms'], badgeColor: '#7d99c0' },
]

export interface ApplyInput {
  fullName: string
  contactPhone?: string | null
  country: string
  primaryPlatform: AmbassadorPlatform
  primaryHandle: string
  audienceSize?: number | null
  niche?: string | null
  motivation: string
  promoChannels: string[]
  sampleUrls: string[]
  socialLinks?: Record<string, string> | null
  agreedToTerms: boolean
}

class AmbassadorService {
  async ensureDefaultTiers() {
    const count = await prisma.ambassadorTier.count()
    if (count > 0) return
    for (const t of DEFAULT_TIERS) {
      await prisma.ambassadorTier.create({
        data: {
          name: t.name,
          order: t.order,
          minActiveReferrals: t.minActiveReferrals,
          commissionPct: new Prisma.Decimal(t.commissionPct),
          perks: t.perks,
          badgeColor: t.badgeColor,
        },
      })
    }
  }

  async getMine(userId: string) {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId },
      include: { tier: true },
    })
    return ambassador
  }

  async apply(userId: string, input: ApplyInput) {
    if (!input.agreedToTerms) throw new Error('Debes aceptar los términos')
    if (input.motivation.length < 100) throw new Error('Motivación demasiado corta (mín 100 chars)')

    const existing = await prisma.ambassador.findUnique({ where: { userId } })
    if (existing) {
      if (existing.status === 'PENDING' || existing.status === 'APPROVED') {
        throw new Error('Ya tienes una solicitud activa')
      }
      if (existing.status === 'REJECTED') {
        const days = (Date.now() - (existing.reviewedAt?.getTime() ?? existing.appliedAt.getTime())) / (1000 * 60 * 60 * 24)
        if (days < 30) throw new Error('Debes esperar 30 días para reaplicar')
      }
    }

    return prisma.ambassador.upsert({
      where: { userId },
      create: {
        userId,
        status: 'PENDING',
        fullName: input.fullName,
        contactPhone: input.contactPhone || null,
        country: input.country,
        primaryPlatform: input.primaryPlatform,
        primaryHandle: input.primaryHandle,
        audienceSize: input.audienceSize ?? null,
        niche: input.niche ?? null,
        motivation: input.motivation,
        promoChannels: input.promoChannels,
        sampleUrls: input.sampleUrls,
        socialLinks: (input.socialLinks ?? {}) as any,
        agreedToTerms: true,
      },
      update: {
        status: 'PENDING',
        rejectionReason: null,
        fullName: input.fullName,
        contactPhone: input.contactPhone || null,
        country: input.country,
        primaryPlatform: input.primaryPlatform,
        primaryHandle: input.primaryHandle,
        audienceSize: input.audienceSize ?? null,
        niche: input.niche ?? null,
        motivation: input.motivation,
        promoChannels: input.promoChannels,
        sampleUrls: input.sampleUrls,
        socialLinks: (input.socialLinks ?? {}) as any,
        agreedToTerms: true,
        appliedAt: new Date(),
      },
    })
  }

  async approve(ambassadorId: string, adminId: string) {
    await this.ensureDefaultTiers()
    const ambassador = await prisma.ambassador.findUnique({ where: { id: ambassadorId }, include: { user: true } })
    if (!ambassador) throw new Error('Ambassador no encontrado')
    if (ambassador.status === 'APPROVED') return ambassador

    const bronze = await prisma.ambassadorTier.findFirst({ where: { order: 1 } })
    const code = ambassador.referralCode || (await generateReferralCode(ambassador.fullName))

    const updated = await prisma.ambassador.update({
      where: { id: ambassadorId },
      data: {
        status: 'APPROVED',
        referralCode: code,
        tierId: bronze?.id,
        approvedAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason: null,
      },
      include: { tier: true, user: true },
    })

    notificationsRepo
      .upsertNotification({
        userId: ambassador.userId,
        type: 'ambassador_approved',
        entityId: ambassador.id,
        title: '¡Eres embajador! 🎉',
        message: `Tu código: ${code}. Empieza a compartir.`,
        href: '/ambassador',
        urgency: 'high',
      })
      .catch((e) => console.error('notification approved failed', e))

    if (updated.user.email) {
      emailService
        .sendAmbassadorApproved(updated.user.email, updated.user.name, code, bronze?.name ?? 'Bronze', Number(bronze?.commissionPct ?? 20))
        .catch((e) => console.error('email approved failed', e))
    }
    return updated
  }

  async reject(ambassadorId: string, adminId: string, reason: string) {
    const ambassador = await prisma.ambassador.findUnique({ where: { id: ambassadorId }, include: { user: true } })
    if (!ambassador) throw new Error('Ambassador no encontrado')
    const updated = await prisma.ambassador.update({
      where: { id: ambassadorId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    })
    notificationsRepo
      .upsertNotification({
        userId: ambassador.userId,
        type: 'ambassador_rejected',
        entityId: ambassador.id,
        title: 'Solicitud no aprobada',
        message: 'Tu solicitud de embajador fue revisada. Revisa tu correo para detalles.',
        href: '/settings?tab=ambassador',
        urgency: 'medium',
      })
      .catch((e) => console.error('notification rejected failed', e))

    if (ambassador.user.email) {
      emailService
        .sendAmbassadorRejected(ambassador.user.email, ambassador.user.name, reason)
        .catch((e) => console.error('email rejected failed', e))
    }
    return updated
  }

  async setTier(ambassadorId: string, tierId: string, _adminId: string) {
    const ambassador = await prisma.ambassador.findUnique({ where: { id: ambassadorId }, include: { tier: true, user: true } })
    if (!ambassador) throw new Error('Not found')
    const tier = await prisma.ambassadorTier.findUnique({ where: { id: tierId } })
    if (!tier) throw new Error('Tier not found')

    const updated = await prisma.ambassador.update({ where: { id: ambassadorId }, data: { tierId }, include: { tier: true } })
    if (ambassador.tier && ambassador.tier.order < tier.order) {
      notificationsRepo
        .upsertNotification({
          userId: ambassador.userId,
          type: 'ambassador_tier_up',
          entityId: ambassador.id,
          title: `¡Subiste a ${tier.name}! 🚀`,
          message: `Comisión: ${tier.commissionPct}%. Nuevos perks desbloqueados.`,
          href: '/ambassador',
          urgency: 'high',
        })
        .catch((e) => console.error('notification tier-up failed', e))

      if (ambassador.user.email) {
        emailService
          .sendAmbassadorTierUp(ambassador.user.email, ambassador.user.name, tier.name, Number(tier.commissionPct), tier.perks)
          .catch((e) => console.error('email tier-up failed', e))
      }
    }
    return updated
  }

  async setCommissionOverride(ambassadorId: string, pct: number | null) {
    return prisma.ambassador.update({
      where: { id: ambassadorId },
      data: { customCommissionPct: pct === null ? null : new Prisma.Decimal(pct) },
    })
  }

  async suspend(ambassadorId: string) {
    return prisma.ambassador.update({ where: { id: ambassadorId }, data: { status: 'SUSPENDED' } })
  }

  async list(filters: { status?: AmbassadorStatus; tierId?: string; search?: string; skip?: number; take?: number }) {
    const where: Prisma.AmbassadorWhereInput = {}
    if (filters.status) where.status = filters.status
    if (filters.tierId) where.tierId = filters.tierId
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { primaryHandle: { contains: filters.search, mode: 'insensitive' } },
        { referralCode: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }
    return prisma.ambassador.findMany({
      where,
      include: { tier: true, user: { select: { id: true, email: true, name: true } }, _count: { select: { referrals: true } } },
      orderBy: [{ status: 'asc' }, { appliedAt: 'desc' }],
      skip: filters.skip ?? 0,
      take: Math.min(filters.take ?? 50, 200),
    })
  }

  async detail(ambassadorId: string) {
    return prisma.ambassador.findUnique({
      where: { id: ambassadorId },
      include: {
        tier: true,
        user: { select: { id: true, email: true, name: true } },
        referrals: { include: { referredUser: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: 'desc' }, take: 100 },
        payouts: { orderBy: { paidAt: 'desc' }, take: 50 },
        _count: { select: { referrals: true, commissions: true } },
      },
    })
  }

  async dashboard(userId: string) {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId },
      include: { tier: true },
    })
    if (!ambassador || ambassador.status !== 'APPROVED') return null

    const [totalRefs, activeRefs, commissionAggAll, commissionAggPaid, nextTier, recentReferrals] = await Promise.all([
      prisma.referral.count({ where: { ambassadorId: ambassador.id } }),
      prisma.referral.count({ where: { ambassadorId: ambassador.id, status: 'ACTIVE' } }),
      prisma.commission.aggregate({ where: { ambassadorId: ambassador.id }, _sum: { amountCents: true } }),
      prisma.commission.aggregate({ where: { ambassadorId: ambassador.id, status: 'PAID' }, _sum: { amountCents: true } }),
      ambassador.tier
        ? prisma.ambassadorTier.findFirst({ where: { order: { gt: ambassador.tier.order } }, orderBy: { order: 'asc' } })
        : Promise.resolve(null),
      prisma.referral.findMany({
        where: { ambassadorId: ambassador.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { referredUser: { select: { name: true } } },
      }),
    ])

    const accruedCents = commissionAggAll._sum.amountCents ?? 0
    const paidCents = commissionAggPaid._sum.amountCents ?? 0
    const owedCents = accruedCents - paidCents

    return {
      status: ambassador.status,
      referralCode: ambassador.referralCode,
      referralLink: `${process.env.APP_URL || 'https://app.theprimeway.app'}/login?ref=${ambassador.referralCode}`,
      tier: ambassador.tier,
      nextTier,
      effectiveCommissionPct: Number(ambassador.customCommissionPct ?? ambassador.tier?.commissionPct ?? 20),
      totals: {
        totalReferrals: totalRefs,
        activeReferrals: activeRefs,
        accruedCents,
        paidCents,
        owedCents,
      },
      recentReferrals: (recentReferrals as Array<typeof recentReferrals[number] & { referredUser: { name: string | null } }>).map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        firstPaidAt: r.firstPaidAt,
        nameInitial: (r.referredUser?.name ?? '?').slice(0, 1).toUpperCase(),
      })),
    }
  }

  async setPayoutMethod(userId: string, method: string, details: Record<string, unknown>) {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId } })
    if (!ambassador) throw new Error('No eres embajador')
    return prisma.ambassador.update({
      where: { id: ambassador.id },
      data: { payoutMethod: method, payoutDetails: details as any },
    })
  }

  async listReferrals(userId: string, opts: { skip?: number; take?: number } = {}) {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId } })
    if (!ambassador) return []
    return prisma.referral.findMany({
      where: { ambassadorId: ambassador.id },
      include: { referredUser: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip ?? 0,
      take: Math.min(opts.take ?? 50, 200),
    })
  }

  async listCommissions(userId: string, opts: { skip?: number; take?: number } = {}) {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId } })
    if (!ambassador) return []
    return prisma.commission.findMany({
      where: { ambassadorId: ambassador.id },
      orderBy: { periodMonth: 'desc' },
      skip: opts.skip ?? 0,
      take: Math.min(opts.take ?? 100, 500),
    })
  }

  // ─── Referral redemption ───────────────────────────────────────────────────

  async validateCode(code: string) {
    const ambassador = await prisma.ambassador.findUnique({
      where: { referralCode: code.trim().toLowerCase() },
      select: { id: true, status: true, fullName: true, tier: { select: { name: true } } },
    })
    if (!ambassador || ambassador.status !== 'APPROVED') return null
    return { ambassadorId: ambassador.id, ambassadorName: ambassador.fullName, tier: ambassador.tier?.name ?? null }
  }

  async redeemCode(userId: string, code: string) {
    const trimmed = code.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, referredByAmbassadorId: true } })
    if (!user) throw new Error('Usuario no encontrado')
    if (user.referredByAmbassadorId) throw new Error('Ya tienes un código aplicado')

    const ambassador = await prisma.ambassador.findUnique({ where: { referralCode: trimmed }, include: { user: { select: { id: true, email: true } } } })
    if (!ambassador || ambassador.status !== 'APPROVED') throw new Error('Código inválido')
    if (ambassador.user.id === userId) throw new Error('No puedes referirte a ti mismo')
    if (ambassador.user.email && user.email && ambassador.user.email === user.email) throw new Error('No puedes referirte a ti mismo')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { referredByAmbassadorId: ambassador.id, referralEnteredAt: new Date() },
      }),
      prisma.referral.create({
        data: {
          ambassadorId: ambassador.id,
          referredUserId: userId,
          source: 'SIGNUP_CODE',
          status: 'SIGNED_UP',
        },
      }),
    ])

    return { ok: true, ambassadorName: ambassador.fullName }
  }

  async maybeUpgradeTier(ambassadorId: string) {
    const ambassador = await prisma.ambassador.findUnique({ where: { id: ambassadorId }, include: { tier: true } })
    if (!ambassador || ambassador.status !== 'APPROVED') return
    const activeCount = await prisma.referral.count({ where: { ambassadorId, status: 'ACTIVE' } })
    const eligibleTier = await prisma.ambassadorTier.findFirst({
      where: { minActiveReferrals: { lte: activeCount } },
      orderBy: { order: 'desc' },
    })
    if (eligibleTier && eligibleTier.id !== ambassador.tierId) {
      const isUpgrade = !ambassador.tier || eligibleTier.order > ambassador.tier.order
      await prisma.ambassador.update({ where: { id: ambassadorId }, data: { tierId: eligibleTier.id } })
      if (isUpgrade) {
        notificationsRepo
          .upsertNotification({
            userId: ambassador.userId,
            type: 'ambassador_tier_up',
            entityId: ambassador.id,
            title: `¡Subiste a ${eligibleTier.name}! 🚀`,
            message: `Comisión: ${eligibleTier.commissionPct}%. Nuevos perks desbloqueados.`,
            href: '/ambassador',
            urgency: 'high',
          })
          .catch((e) => console.error('notification auto tier-up failed', e))

        const user = await prisma.user.findUnique({ where: { id: ambassador.userId }, select: { email: true, name: true } })
        if (user?.email) {
          emailService
            .sendAmbassadorTierUp(user.email, user.name, eligibleTier.name, Number(eligibleTier.commissionPct), eligibleTier.perks)
            .catch((e) => console.error('email auto tier-up failed', e))
        }
      }
    }
  }

  // ─── Payouts ──────────────────────────────────────────────────────────────

  async owedForAmbassador(ambassadorId: string) {
    const agg = await prisma.commission.aggregate({
      where: { ambassadorId, status: 'APPROVED' },
      _sum: { amountCents: true },
      _count: true,
    })
    return { amountCents: agg._sum.amountCents ?? 0, commissionsCount: agg._count }
  }

  async registerPayout(ambassadorId: string, adminId: string, input: { amountCents: number; method: string; externalRef?: string; notes?: string }) {
    const approvedCommissions = await prisma.commission.findMany({
      where: { ambassadorId, status: 'APPROVED' },
      orderBy: { periodMonth: 'asc' },
    })
    const payout = await prisma.$transaction(async (tx) => {
      const p = await tx.ambassadorPayout.create({
        data: {
          ambassadorId,
          amountCents: input.amountCents,
          method: input.method,
          externalRef: input.externalRef ?? null,
          notes: input.notes ?? null,
          paidAt: new Date(),
          paidBy: adminId,
        },
      })
      if (approvedCommissions.length > 0) {
        await tx.commission.updateMany({
          where: { id: { in: approvedCommissions.map((c) => c.id) } },
          data: { status: 'PAID', payoutId: p.id },
        })
      }
      return p
    })

    const ambassador = await prisma.ambassador.findUnique({ where: { id: ambassadorId }, include: { user: { select: { email: true, name: true } } } })
    if (ambassador?.user.email) {
      notificationsRepo
        .upsertNotification({
          userId: ambassador.userId,
          type: 'ambassador_payout_sent',
          entityId: payout.id,
          title: '💰 Pago enviado',
          message: `Te enviamos $${(input.amountCents / 100).toFixed(2)} vía ${input.method}.`,
          href: '/ambassador',
          urgency: 'medium',
        })
        .catch((e) => console.error('notification payout failed', e))

      emailService
        .sendAmbassadorPayout(ambassador.user.email, ambassador.user.name, input.amountCents, input.method, input.externalRef ?? null)
        .catch((e) => console.error('email payout failed', e))
    }
    return payout
  }

  // ─── Tiers CRUD ───────────────────────────────────────────────────────────

  async listTiers() {
    await this.ensureDefaultTiers()
    return prisma.ambassadorTier.findMany({ orderBy: { order: 'asc' } })
  }

  async updateTier(id: string, data: { name?: string; minActiveReferrals?: number; commissionPct?: number; perks?: string[]; badgeColor?: string }) {
    return prisma.ambassadorTier.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.minActiveReferrals !== undefined && { minActiveReferrals: data.minActiveReferrals }),
        ...(data.commissionPct !== undefined && { commissionPct: new Prisma.Decimal(data.commissionPct) }),
        ...(data.perks !== undefined && { perks: data.perks }),
        ...(data.badgeColor !== undefined && { badgeColor: data.badgeColor }),
      },
    })
  }
}

export const ambassadorService = new AmbassadorService()
