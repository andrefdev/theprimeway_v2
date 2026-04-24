import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

export type RitualKind =
  | 'DAILY_PLAN'
  | 'DAILY_SHUTDOWN'
  | 'WEEKLY_PLAN'
  | 'WEEKLY_REVIEW'
  | 'QUARTERLY_REVIEW'
  | 'ANNUAL_REVIEW'
  | 'CUSTOM'

export type RitualStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
export type RitualCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ON_DEMAND'

export interface RitualCreate {
  kind: RitualKind
  name: string
  cadence: RitualCadence
  scheduledTime?: string
  steps: unknown[]
  isEnabled?: boolean
}

export interface InstancePatch {
  status?: RitualStatus
  startedAt?: Date
  completedAt?: Date
  snapshot?: Record<string, unknown>
}

const includeRitualRefs = { ritual: true, reflections: true } as const

class RitualsRepository {
  // ── Ritual templates ──────────────────────────────────
  listSystemTemplates() {
    return prisma.ritual.findMany({ where: { userId: null } })
  }

  listForUser(userId: string) {
    return prisma.ritual.findMany({ where: { OR: [{ userId }, { userId: null }] } })
  }

  findEnabledByKind(userId: string | null, kind: RitualKind) {
    return prisma.ritual.findFirst({ where: { userId, kind, isEnabled: true } })
  }

  createForUser(userId: string, data: RitualCreate) {
    return prisma.ritual.create({
      data: {
        userId,
        kind: data.kind,
        name: data.name,
        cadence: data.cadence,
        scheduledTime: data.scheduledTime,
        steps: data.steps as Prisma.InputJsonValue,
        isEnabled: data.isEnabled ?? true,
      },
    })
  }

  async updateForUser(id: string, userId: string, data: Partial<RitualCreate>) {
    const r = await prisma.ritual.updateMany({
      where: { id, userId },
      data: data as any,
    })
    if (r.count === 0) return null
    return prisma.ritual.findUnique({ where: { id } })
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const r = await prisma.ritual.deleteMany({ where: { id, userId } })
    return r.count > 0
  }

  // ── Ritual instances ──────────────────────────────────
  listInstancesForUser(userId: string, limit = 100) {
    return prisma.ritualInstance.findMany({
      where: { userId },
      include: includeRitualRefs,
      orderBy: { scheduledFor: 'desc' },
      take: limit,
    })
  }

  findInstanceByIdAndUser(id: string, userId: string) {
    return prisma.ritualInstance.findFirst({ where: { id, userId }, include: includeRitualRefs })
  }

  findInstanceInRange(userId: string, ritualId: string, range: { gte: Date; lt?: Date; lte?: Date }) {
    const scheduledFor: any = { gte: range.gte }
    if (range.lt) scheduledFor.lt = range.lt
    if (range.lte) scheduledFor.lte = range.lte
    return prisma.ritualInstance.findFirst({
      where: { userId, ritualId, scheduledFor },
      include: includeRitualRefs,
    })
  }

  createInstance(userId: string, data: { ritualId: string; scheduledFor: Date; status?: RitualStatus }) {
    return prisma.ritualInstance.create({
      data: { userId, ...data, status: data.status ?? 'PENDING' },
      include: includeRitualRefs,
    })
  }

  async patchInstance(id: string, userId: string, data: InstancePatch) {
    const r = await prisma.ritualInstance.updateMany({
      where: { id, userId },
      data: data as any,
    })
    if (r.count === 0) return null
    return prisma.ritualInstance.findUnique({ where: { id } })
  }

  updateInstanceSnapshot(id: string, snapshot: Record<string, unknown>) {
    return prisma.ritualInstance.update({
      where: { id },
      data: { snapshot: snapshot as any },
    })
  }

  findPendingDaily(userId: string, dayStart: Date, dayEnd: Date) {
    return prisma.ritualInstance.findMany({
      where: {
        userId,
        scheduledFor: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: includeRitualRefs,
      orderBy: { scheduledFor: 'asc' },
    })
  }

  findPendingWeekly(userId: string, weekStart: Date, weekEnd: Date) {
    return prisma.ritualInstance.findMany({
      where: {
        userId,
        scheduledFor: { gte: weekStart, lt: weekEnd },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        ritual: { kind: { in: ['WEEKLY_PLAN', 'WEEKLY_REVIEW'] } },
      },
      include: includeRitualRefs,
      orderBy: { scheduledFor: 'asc' },
    })
  }

  // ── Reflections ──────────────────────────────────────
  createReflection(data: { ritualInstanceId: string; promptKey: string; body: string; attachedGoalId?: string }) {
    return prisma.reflectionEntry.create({ data })
  }

  // ── UserSettings ──────────────────────────────────────
  findUserSettings(userId: string) {
    return prisma.userSettings.findUnique({ where: { userId } })
  }

  // ── AI context queries (for ritual AI summary) ────────
  findCompletedTasksInWindow(userId: string, gte: Date, lt: Date, take = 60) {
    return prisma.task.findMany({
      where: { userId, status: 'completed', completedAt: { gte, lt } },
      select: {
        title: true,
        priority: true,
        goalLinks: { select: { goal: { select: { title: true, horizon: true } } }, take: 1 },
      },
      take,
    })
  }

  findGoalsTouchedInWindow(userId: string, gte: Date, lt: Date, take = 30) {
    return prisma.goal.findMany({
      where: { userId, updatedAt: { gte, lt } },
      select: { title: true, horizon: true, status: true, visionContribution: true },
      take,
    })
  }

  findOpenBacklog(userId: string, take = 20) {
    return prisma.task.findMany({
      where: { userId, status: 'open', archivedAt: null },
      select: { title: true, priority: true, dueDate: true },
      orderBy: { priority: 'desc' },
      take,
    })
  }

  findActiveQuarterlyGoals(userId: string, take = 10) {
    return prisma.goal.findMany({
      where: { userId, horizon: 'QUARTER', status: 'ACTIVE' },
      select: { title: true, visionContribution: true },
      take,
    })
  }
}

export const ritualsRepo = new RitualsRepository()
