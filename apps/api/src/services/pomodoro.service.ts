import { pomodoroRepo } from '../repositories/pomodoro.repo'
import { prisma } from '../lib/prisma'
import { validateLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'
import { gamificationEvents } from './gamification/events'

const XP_VALUES = { pomodoro: 15 }

class PomodoroService {
  async listSessions(
    userId: string,
    opts: {
      sessionType?: string
      taskId?: string
      isCompleted?: boolean
      dateFrom?: string
      dateTo?: string
      limit: number
      offset: number
    },
  ) {
    const where: Record<string, unknown> = { userId }
    if (opts.sessionType) where.sessionType = opts.sessionType
    if (opts.taskId) where.taskId = opts.taskId
    if (opts.isCompleted !== undefined) where.isCompleted = opts.isCompleted
    if (opts.dateFrom || opts.dateTo) {
      where.startedAt = {}
      if (opts.dateFrom) (where.startedAt as Record<string, unknown>).gte = new Date(opts.dateFrom)
      if (opts.dateTo) (where.startedAt as Record<string, unknown>).lte = new Date(opts.dateTo)
    }

    const [sessions, count] = await Promise.all([
      pomodoroRepo.findManySessions(where, { limit: opts.limit, offset: opts.offset }),
      pomodoroRepo.countSessions(where),
    ])

    return { sessions, count }
  }

  async createSession(
    userId: string,
    body: {
      sessionType?: string
      durationMinutes?: number
      taskId?: string
      startedAt?: string
    },
  ) {
    // Check daily pomodoro limit
    const [subscription, usage] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
      prisma.userUsageStat.findFirst({
        where: { userId },
      }),
    ])

    const plan = subscription?.plan
    if (plan) {
      validateLimit(
        FEATURES.POMODORO_DAILY_LIMIT,
        plan,
        usage?.dailyPomodoroSessions ?? 0,
      )
    }

    return pomodoroRepo.createSession({
      userId,
      sessionType: body.sessionType || 'focus',
      plannedDuration: body.durationMinutes || 25,
      taskId: body.taskId || null,
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
      isCompleted: false,
    })
  }

  async getSession(userId: string, id: string) {
    return pomodoroRepo.findSessionByIdAndUser(id, userId)
  }

  async updateSession(
    userId: string,
    id: string,
    body: {
      isCompleted?: boolean
      actualDuration?: number
      endedAt?: string
      notes?: string
    },
  ) {
    const existing = await pomodoroRepo.findSessionOwnership(id, userId)
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (body.isCompleted !== undefined) updateData.isCompleted = body.isCompleted
    if (body.actualDuration !== undefined) updateData.actualDuration = body.actualDuration
    if (body.endedAt !== undefined) updateData.completedAt = new Date(body.endedAt)
    if (body.notes !== undefined) updateData.notes = body.notes

    const session = await pomodoroRepo.updateSession(id, updateData)

    // Award XP on focus session completion
    if (body.isCompleted && session.sessionType === 'focus') {
      try {
        const today = new Date().toISOString().split('T')[0]!
        await pomodoroRepo.createXpEvent({
          userId,
          source: 'pomodoro',
          sourceId: id,
          amount: XP_VALUES.pomodoro,
          earnedDate: today,
          metadata: { sessionType: session.sessionType, duration: body.actualDuration },
        })
      } catch (xpError) {
        console.error('[POMODORO] Failed to award XP:', xpError)
      }
      gamificationEvents.emit('pomodoro.completed', { userId, meta: { sessionId: id } })
    }

    return session
  }

  async deleteSession(userId: string, id: string) {
    const existing = await pomodoroRepo.findSessionOwnership(id, userId)
    if (!existing) return false

    await pomodoroRepo.deleteSession(id)
    return true
  }

  async getStats(userId: string) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const [totalSessions, totalFocusMinutes, todaySessions, weekSessions] = await Promise.all([
      pomodoroRepo.countCompletedFocus(userId),
      pomodoroRepo.sumFocusMinutes(userId),
      pomodoroRepo.countCompletedFocusInRange(userId, todayStart, todayEnd),
      pomodoroRepo.countCompletedFocusInRange(userId, weekStart),
    ])

    return {
      totalSessions,
      totalFocusMinutes: totalFocusMinutes._sum.plannedDuration || 0,
      todaySessions,
      weekSessions,
    }
  }
}

export const pomodoroService = new PomodoroService()
