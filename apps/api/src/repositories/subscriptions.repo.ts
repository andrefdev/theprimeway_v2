import { prisma } from '../lib/prisma'

class SubscriptionsRepository {
  async findActivePlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findLatestSubscription(userId: string) {
    return prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    })
  }

  async findSubscriptionByUser(userId: string) {
    return prisma.userSubscription.findFirst({ where: { userId } })
  }

  async createSubscription(data: Record<string, unknown>) {
    return prisma.userSubscription.create({ data: data as any })
  }

  async upsertSubscriptionByLsId(
    lemonSqueezySubscriptionId: string,
    updateData: Record<string, unknown>,
    createData: Record<string, unknown>,
  ) {
    return prisma.userSubscription.upsert({
      where: { lemonSqueezySubscriptionId },
      update: updateData,
      create: createData as any,
    })
  }

  async updateManyByLsId(lemonSqueezySubscriptionId: string, data: Record<string, unknown>) {
    return prisma.userSubscription.updateMany({
      where: { lemonSqueezySubscriptionId },
      data,
    })
  }
}

export const subscriptionsRepo = new SubscriptionsRepository()
