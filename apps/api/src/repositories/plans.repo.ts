import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

const adminSelect = {
  id: true,
  name: true,
  displayName: true,
  description: true,
  price: true,
  currency: true,
  billingInterval: true,
  lemonSqueezyProductId: true,
  lemonSqueezyVariantId: true,
  trialPeriodDays: true,
  maxHabits: true,
  maxGoals: true,
  maxNotes: true,
  maxTasks: true,
  maxPomodoroSessionsDaily: true,
  hasAiAssistant: true,
  hasReadingModule: true,
  hasNotesModule: true,
  hasAdvancedAnalytics: true,
  hasCustomThemeCreation: true,
  hasExportData: true,
  hasPrioritySupport: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubscriptionPlanSelect

export type PlanRow = Prisma.SubscriptionPlanGetPayload<{ select: typeof adminSelect }>

class PlansRepository {
  async list(opts: { includeInactive?: boolean } = {}) {
    return prisma.subscriptionPlan.findMany({
      where: opts.includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: adminSelect,
    })
  }

  async findById(id: string) {
    return prisma.subscriptionPlan.findUnique({ where: { id }, select: adminSelect })
  }

  async create(data: Prisma.SubscriptionPlanCreateInput) {
    return prisma.subscriptionPlan.create({ data, select: adminSelect })
  }

  async update(id: string, data: Prisma.SubscriptionPlanUpdateInput) {
    return prisma.subscriptionPlan.update({ where: { id }, data, select: adminSelect })
  }

  async setActive(id: string, isActive: boolean) {
    return prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive },
      select: adminSelect,
    })
  }

  async countActiveSubscriptions(planId: string) {
    return prisma.userSubscription.count({
      where: { planId, status: { in: ['active', 'trialing', 'pending'] } },
    })
  }

  async hardDelete(id: string) {
    return prisma.subscriptionPlan.delete({ where: { id } })
  }
}

export const plansRepo = new PlansRepository()
