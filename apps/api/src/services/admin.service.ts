import { adminRepo } from '../repositories/admin.repo'

interface SetSubscriptionInput {
  planId: string | null
  status: string
  endsAt?: string | null
  reason?: string
  adminUserId: string
}

class AdminService {
  isAdmin(userId: string) {
    return adminRepo.findUserRole(userId).then((u: { role: string } | null) => u?.role === 'ADMIN')
  }

  listUsers(params: { page: number; limit: number; search?: string }) {
    const where = params.search
      ? { email: { contains: params.search, mode: 'insensitive' as const } }
      : {}
    return Promise.all([
      adminRepo.listUsers(where, (params.page - 1) * params.limit, params.limit),
      adminRepo.countUsers(where),
    ])
  }

  getUser(userId: string) { return adminRepo.findUserDetails(userId) }

  async getUserSubscription(userId: string) {
    const user = await adminRepo.userExists(userId)
    if (!user) return { ok: false as const, reason: 'user_not_found' as const }
    const subscription = await adminRepo.findUserSubscription(userId)
    let planTier = 'free'
    let status = 'inactive'
    if (subscription) {
      status = subscription.status ?? 'pending'
      if (subscription.status === 'active') planTier = 'premium'
      else if (subscription.status === 'trialing') planTier = 'trial'
    }
    return {
      ok: true as const,
      data: {
        userId,
        planTier,
        status,
        currentPeriodStart: subscription?.startsAt ? subscription.startsAt.toISOString() : null,
        currentPeriodEnd: subscription?.endsAt ? subscription.endsAt.toISOString() : null,
      },
    }
  }

  async setUserSubscription(userId: string, input: SetSubscriptionInput) {
    const user = await adminRepo.userExists(userId)
    if (!user) return { ok: false as const, reason: 'user_not_found' as const }

    let plan: { id: string; price: unknown; currency: string; billingInterval: string } | null = null
    if (input.planId) {
      const found = await adminRepo.findPlan(input.planId)
      if (!found) return { ok: false as const, reason: 'plan_not_found' as const }
      plan = { id: found.id, price: found.price, currency: found.currency, billingInterval: found.billingInterval }
    }

    const existing = await adminRepo.findLatestSubscriptionByUser(userId)
    const now = new Date()
    const metadata = {
      source: 'manual',
      setBy: input.adminUserId,
      setAt: now.toISOString(),
      reason: input.reason ?? null,
    }

    const subscription = existing
      ? await adminRepo.updateSubscription(existing.id, {
          planId: plan?.id ?? null,
          status: input.status,
          endsAt: input.endsAt ? new Date(input.endsAt) : existing.endsAt,
          metadata,
          updatedAt: now,
        })
      : await adminRepo.createSubscription({
          userId,
          planId: plan?.id ?? null,
          status: input.status,
          amount: (plan?.price as any) ?? 0,
          currency: plan?.currency ?? 'USD',
          billingInterval: plan?.billingInterval ?? 'monthly',
          startsAt: now,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          metadata,
        })
    return { ok: true as const, subscription }
  }

  async analyticsSummary() {
    const now = new Date()
    const day = 24 * 60 * 60 * 1000
    const since7d = new Date(now.getTime() - 7 * day)
    const since30d = new Date(now.getTime() - 30 * day)

    const [
      totalUsers,
      admins,
      subscriptionsByStatus,
      subscriptionsByPlan,
      featureOverrideRows,
      usageAgg,
      dau,
      mau,
      tasksLast30d,
      habitsLast30d,
      notesLast30d,
      pomodoroLast30d,
      plans,
    ] = await Promise.all([
      adminRepo.countUsers(),
      adminRepo.countAdmins(),
      adminRepo.subscriptionsByStatus(),
      adminRepo.subscriptionsByPlan(),
      adminRepo.featureOverridesGrouped(),
      adminRepo.usageAggregate(),
      adminRepo.activeUsersSince(since7d),
      adminRepo.activeUsersSince(since30d),
      adminRepo.tasksCreatedSince(since30d),
      adminRepo.habitsCreatedSince(since30d),
      adminRepo.notesCreatedSince(since30d),
      adminRepo.pomodoroCreatedSince(since30d),
      adminRepo.listPlansBrief(),
    ])

    type PlanBrief = { id: string; name: string; displayName: string }
    const planById = new Map<string, PlanBrief>(
      (plans as PlanBrief[]).map((p) => [p.id, p]),
    )

    const byPlan = subscriptionsByPlan.map((row: any) => ({
      planId: row.planId,
      planName: row.planId ? planById.get(row.planId)?.name ?? 'unknown' : 'none',
      displayName: row.planId ? planById.get(row.planId)?.displayName ?? 'Unknown' : 'No plan',
      count: row._count._all,
    }))

    const byStatus = subscriptionsByStatus.map((row: any) => ({
      status: row.status ?? 'unknown',
      count: row._count._all,
    }))

    const overrideMap = new Map<string, { enabled: number; disabled: number }>()
    for (const row of featureOverrideRows as any[]) {
      const current = overrideMap.get(row.featureKey) ?? { enabled: 0, disabled: 0 }
      if (row.enabled) current.enabled += row._count._all
      else current.disabled += row._count._all
      overrideMap.set(row.featureKey, current)
    }
    const featureOverrides = Array.from(overrideMap.entries()).map(([featureKey, counts]) => ({
      featureKey,
      ...counts,
    }))

    return {
      users: { total: totalUsers, admins, dau7d: dau, mau30d: mau },
      subscriptions: { byStatus, byPlan },
      usage: {
        totalHabits: usageAgg._sum.currentHabits ?? 0,
        totalGoals: usageAgg._sum.currentGoals ?? 0,
        totalNotes: usageAgg._sum.currentNotes ?? 0,
        totalTasks: usageAgg._sum.currentTasks ?? 0,
        dailyPomodoroSessions: usageAgg._sum.dailyPomodoroSessions ?? 0,
        dailyAiRequests: usageAgg._sum.dailyAiRequests ?? 0,
      },
      growth30d: {
        tasks: tasksLast30d,
        habits: habitsLast30d,
        notes: notesLast30d,
        pomodoro: pomodoroLast30d,
      },
      featureOverrides,
    }
  }
}

export const adminService = new AdminService()
