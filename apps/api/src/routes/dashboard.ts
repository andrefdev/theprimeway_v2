/**
 * Dashboard Routes — Aggregated summary endpoint
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { format } from 'date-fns'
import type { AppEnv } from '../types/env'

export const dashboardRoutes = new OpenAPIHono<AppEnv>()

dashboardRoutes.use('*', authMiddleware)

const summaryRoute = createRoute({
  method: 'get',
  path: '/summary',
  tags: ['Dashboard'],
  summary: 'Get aggregated dashboard summary',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              tasks: z.object({
                todayTotal: z.number(),
                todayCompleted: z.number(),
                overdueCount: z.number(),
              }),
              habits: z.object({
                activeCount: z.number(),
                completedToday: z.number(),
              }),
              finances: z.object({
                totalBalance: z.number(),
                accountCount: z.number(),
              }),
              gamification: z.object({
                level: z.number(),
                totalXp: z.number(),
                currentStreak: z.number(),
              }),
            }),
          }),
        },
      },
      description: 'Dashboard summary',
    },
  },
})

dashboardRoutes.openapi(summaryRoute, async (c) => {
  const userId = c.get('user').userId
  const today = format(new Date(), 'yyyy-MM-dd')
  const dayStart = new Date(`${today}T00:00:00.000Z`)
  const dayEnd = new Date(`${today}T23:59:59.999Z`)

  const [
    todayTasks,
    overdueCount,
    activeHabits,
    todayHabitLogs,
    accounts,
    gamProfile,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { userId, scheduledDate: { gte: dayStart, lte: dayEnd } },
      select: { status: true },
    }),
    prisma.task.count({
      where: {
        userId,
        status: 'open',
        dueDate: { lt: dayStart },
      },
    }),
    prisma.task.findMany({
      where: { userId, kind: 'HABIT', archivedAt: null },
      select: { id: true },
    }),
    prisma.habitLog.findMany({
      where: {
        userId,
        date: { gte: new Date(`${today}T00:00:00.000Z`), lt: new Date(`${today}T23:59:59.999Z`) },
      },
      select: { taskId: true, completedCount: true },
    }),
    prisma.financeAccount.findMany({
      where: { userId, isActive: true },
      select: { currentBalance: true },
    }),
    prisma.gamificationProfile.findFirst({
      where: { userId },
      select: { level: true, totalXp: true, currentStreak: true },
    }),
  ])

  const todayCompleted = todayTasks.filter((t) => t.status === 'completed').length
  const habitCompletedToday = new Set(
    todayHabitLogs.filter((l: any) => (l.completedCount ?? 0) > 0).map((l: any) => l.taskId),
  ).size
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance ?? 0), 0)

  return c.json({
    data: {
      tasks: {
        todayTotal: todayTasks.length,
        todayCompleted,
        overdueCount,
      },
      habits: {
        activeCount: activeHabits.length,
        completedToday: habitCompletedToday,
      },
      finances: {
        totalBalance,
        accountCount: accounts.length,
      },
      gamification: {
        level: gamProfile?.level ?? 1,
        totalXp: gamProfile?.totalXp ?? 0,
        currentStreak: gamProfile?.currentStreak ?? 0,
      },
    },
  }, 200)
})
