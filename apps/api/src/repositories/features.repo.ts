import { prisma } from '../lib/prisma'

class FeaturesRepository {
  /** Single query: active subscription + plan + all user overrides */
  async findUserFeatureData(userId: string) {
    const [subscription, overrides] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
      prisma.userFeatureOverride.findMany({ where: { userId } }),
    ])
    return { subscription, overrides }
  }

  async upsertOverride(
    userId: string,
    featureKey: string,
    enabled: boolean,
    reason: string | null,
    createdBy: string,
  ) {
    return prisma.userFeatureOverride.upsert({
      where: { userId_featureKey: { userId, featureKey } },
      update: { enabled, reason, updatedAt: new Date() },
      create: { userId, featureKey, enabled, reason, createdBy },
    })
  }

  async deleteOverride(userId: string, featureKey: string) {
    return prisma.userFeatureOverride.deleteMany({
      where: { userId, featureKey },
    })
  }

  async findOverridesByUser(userId: string) {
    return prisma.userFeatureOverride.findMany({ where: { userId } })
  }
}

export const featuresRepo = new FeaturesRepository()
