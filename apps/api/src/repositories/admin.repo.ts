import { prisma } from '../lib/prisma'

class AdminRepository {
  findUserRole(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  }

  listUsers(where: any, skip: number, take: number) {
    return prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true },
      skip,
      take,
      orderBy: { id: 'desc' },
    })
  }

  countUsers(where: any = {}) {
    return prisma.user.count({ where })
  }

  findUserDetails(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    })
  }

  userExists(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } })
  }

  findUserSubscription(userId: string) {
    return prisma.userSubscription.findFirst({
      where: { userId },
      include: { plan: { select: { name: true } } },
      orderBy: { id: 'desc' },
    })
  }

  findPlan(planId: string) {
    return prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  }

  findLatestSubscriptionByUser(userId: string) {
    return prisma.userSubscription.findFirst({ where: { userId }, orderBy: { id: 'desc' } })
  }

  updateSubscription(id: string, data: any) {
    return prisma.userSubscription.update({ where: { id }, data })
  }

  createSubscription(data: any) {
    return prisma.userSubscription.create({ data })
  }

  // ── Analytics aggregations ───────────────────────────────
  countAdmins() { return prisma.user.count({ where: { role: 'ADMIN' } }) }

  subscriptionsByStatus() {
    return prisma.userSubscription.groupBy({ by: ['status'], _count: { _all: true } })
  }

  subscriptionsByPlan() {
    return prisma.userSubscription.groupBy({ by: ['planId'], _count: { _all: true } })
  }

  featureOverridesGrouped() {
    return prisma.userFeatureOverride.groupBy({
      by: ['featureKey', 'enabled'],
      _count: { _all: true },
    })
  }

  usageAggregate() {
    return prisma.userUsageStat.aggregate({
      _sum: {
        currentHabits: true,
        currentGoals: true,
        currentTasks: true,
        dailyPomodoroSessions: true,
        dailyAiRequests: true,
      },
    })
  }

  activeUsersSince(since: Date) {
    return prisma.userUsageStat.count({ where: { updatedAt: { gte: since } } })
  }

  tasksCreatedSince(since: Date) {
    return prisma.task.count({ where: { createdAt: { gte: since } } })
  }

  habitsCreatedSince(since: Date) {
    return prisma.task.count({ where: { kind: 'HABIT', createdAt: { gte: since } } })
  }

  pomodoroCreatedSince(since: Date) {
    return prisma.workingSession.count({ where: { kind: 'POMODORO', createdAt: { gte: since } } })
  }

  listPlansBrief() {
    return prisma.subscriptionPlan.findMany({
      select: { id: true, name: true, displayName: true },
    })
  }
}

export const adminRepo = new AdminRepository()
