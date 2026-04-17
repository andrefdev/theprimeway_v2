import { gamificationRepo } from '../repositories/gamification.repo'
import { prisma } from '../lib/prisma'
import { generateObject } from 'ai'
import { taskModel } from '../lib/ai-models'
import { z } from 'zod'

const RANK_THRESHOLDS: Record<string, { minXp: number; minLevel: number; minStreak: number }> = {
  E: { minXp: 0, minLevel: 1, minStreak: 0 },
  D: { minXp: 500, minLevel: 5, minStreak: 3 },
  C: { minXp: 2000, minLevel: 10, minStreak: 7 },
  B: { minXp: 5000, minLevel: 20, minStreak: 14 },
  A: { minXp: 15000, minLevel: 35, minStreak: 30 },
  S: { minXp: 50000, minLevel: 50, minStreak: 60 },
}

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'] as const

function rankOrder(rank: string): number {
  return { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 }[rank] ?? 0
}

function calculateLevel(totalXp: number): {
  level: number
  xpForCurrentLevel: number
  xpForNextLevel: number
} {
  let level = 1
  let xpNeeded = 100
  let xpConsumed = 0

  while (totalXp >= xpConsumed + xpNeeded) {
    xpConsumed += xpNeeded
    level++
    xpNeeded = 100 + (level - 1) * 50
  }

  return {
    level,
    xpForCurrentLevel: totalXp - xpConsumed,
    xpForNextLevel: xpNeeded,
  }
}

// In-memory store for recent level-up / rank-up events (cleared after reading)
const recentLevelEvents = new Map<
  string,
  Array<{ type: 'level_up' | 'rank_up'; data: Record<string, unknown>; timestamp: number }>
>()

class GamificationService {
  async getProfile(userId: string, todayDate?: string) {
    const date = todayDate || new Date().toISOString().split('T')[0]!

    let profile = await gamificationRepo.findProfile(userId)
    if (!profile) {
      profile = await gamificationRepo.createProfile(userId)
    }

    const todayXp = await gamificationRepo.aggregateTodayXp(userId, date)
    const levelInfo = calculateLevel(profile.totalXp)

    return {
      totalXp: profile.totalXp,
      level: levelInfo.level,
      rank: profile.rank,
      xpForCurrentLevel: levelInfo.xpForCurrentLevel,
      xpForNextLevel: levelInfo.xpForNextLevel,
      dailyXp: todayXp._sum.amount || 0,
      dailyGoal: profile.dailyGoal,
      title: profile.title,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
    }
  }

  async updateProfileSettings(
    userId: string,
    body: { dailyGoal?: number; title?: string },
  ) {
    const updateData: Record<string, unknown> = {}
    if (body.dailyGoal !== undefined) updateData.dailyGoal = body.dailyGoal
    if (body.title !== undefined) updateData.title = body.title

    await gamificationRepo.upsertProfile(userId, {}, {})

    const updated = await gamificationRepo.updateProfile(userId, updateData)
    return { dailyGoal: updated.dailyGoal, title: updated.title }
  }

  async awardXp(
    userId: string,
    body: {
      source: string
      sourceId?: string
      amount: number
      earnedDate?: string
      metadata?: Record<string, unknown>
    },
  ) {
    // Get current streak for multiplier
    const profile = await gamificationRepo.findProfile(userId)
    let multiplier = 1
    if (profile && profile.currentStreak >= 7) {
      if (profile.currentStreak >= 90) {
        multiplier = 5
      } else if (profile.currentStreak >= 30) {
        multiplier = 3
      } else if (profile.currentStreak >= 14) {
        multiplier = 2
      } else if (profile.currentStreak >= 7) {
        multiplier = 1.5
      }
    }

    const finalXpAmount = Math.round(body.amount * multiplier)

    // Detect level change (before XP is applied)
    const oldLevel = calculateLevel(profile?.totalXp ?? 0).level
    const newTotalXp = (profile?.totalXp ?? 0) + finalXpAmount
    const newLevel = calculateLevel(newTotalXp).level

    const xpEvent = await gamificationRepo.createXpEvent({
      userId,
      source: body.source,
      sourceId: body.sourceId || null,
      amount: finalXpAmount,
      earnedDate: body.earnedDate || new Date().toISOString().split('T')[0]!,
      metadata: {
        ...body.metadata,
        baseAmount: body.amount,
        streakMultiplier: multiplier > 1 ? multiplier : undefined,
      },
    })

    await gamificationRepo.upsertProfile(
      userId,
      { totalXp: { increment: finalXpAmount } },
      { totalXp: finalXpAmount },
    )

    // Check for rank-up after awarding XP
    const rankResult = await this.checkAndUpdateRank(userId)

    // Build level-up / rank-up events
    const events: Array<{ type: 'level_up' | 'rank_up'; data: Record<string, unknown> }> = []

    if (newLevel > oldLevel) {
      events.push({
        type: 'level_up',
        data: { previousLevel: oldLevel, newLevel, totalXp: newTotalXp },
      })
    }

    if (rankResult.ranked_up) {
      events.push({
        type: 'rank_up',
        data: { previousRank: rankResult.previousRank, newRank: rankResult.newRank },
      })
    }

    // Store events for frontend polling
    if (events.length > 0) {
      const existing = recentLevelEvents.get(userId) || []
      existing.push(...events.map((e) => ({ ...e, timestamp: Date.now() })))
      recentLevelEvents.set(userId, existing)

      // Attempt push notification (fire-and-forget, lazy import to avoid circular dep)
      import('./notifications.service')
        .then(({ notificationsService }) => {
          for (const event of events) {
            const title =
              event.type === 'level_up'
                ? `Level Up! You reached level ${event.data.newLevel}`
                : `Rank Up! You reached rank ${event.data.newRank}`
            notificationsService
              .sendPush({
                userIds: [userId],
                title: 'Congratulations!',
                body: title,
                tag: event.type,
              })
              .catch(() => {})
          }
        })
        .catch(() => {})
    }

    return {
      ...xpEvent,
      levelUp: newLevel > oldLevel ? { oldLevel, newLevel } : null,
      rankUp: rankResult.ranked_up ? rankResult : null,
    }
  }

  /** Get and clear recent level-up / rank-up events for a user */
  getLevelUpEvents(userId: string) {
    const events = recentLevelEvents.get(userId) || []
    recentLevelEvents.delete(userId)
    return events
  }

  async getDailyXp(userId: string, days: number) {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)
    const dateFromStr = dateFrom.toISOString().split('T')[0]!

    const snapshots = await gamificationRepo.findDailyXpSnapshots(userId, dateFromStr)
    return { snapshots, count: snapshots.length }
  }

  async getXpHistory(
    userId: string,
    opts: {
      source?: string
      dateFrom?: string
      dateTo?: string
      limit: number
      offset: number
    },
  ) {
    const where: Record<string, unknown> = { userId }
    if (opts.source) where.source = opts.source
    if (opts.dateFrom || opts.dateTo) {
      where.earnedDate = {}
      if (opts.dateFrom) (where.earnedDate as Record<string, unknown>).gte = opts.dateFrom
      if (opts.dateTo) (where.earnedDate as Record<string, unknown>).lte = opts.dateTo
    }

    const [events, count] = await Promise.all([
      gamificationRepo.findXpHistory(where, { limit: opts.limit, offset: opts.offset }),
      gamificationRepo.countXpHistory(where),
    ])

    return { events, count }
  }

  async getStreak(userId: string) {
    const profile = await gamificationRepo.findProfile(userId)
    if (!profile) {
      return { currentStreak: 0, longestStreak: 0, lastCheckIn: null, heatmap: [] }
    }

    // Fetch last 90 days of daily XP snapshots for heatmap
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
    const dateFrom = ninetyDaysAgo.toISOString().split('T')[0]!

    const snapshots = await gamificationRepo.findDailyXpSnapshots(userId, dateFrom)

    const heatmap = snapshots.map((s) => ({
      date: s.date,
      totalXp: s.totalXp,
      goalMet: s.goalMet,
    }))

    const p = profile as any
    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      lastCheckIn: p.lastCheckIn ? p.lastCheckIn.toISOString() : (p.lastActiveDate || null),
      heatmap,
    }
  }

  async checkInStreak(userId: string, checkInDate?: string) {
    const dateStr = checkInDate || new Date().toISOString().split('T')[0]!

    let profile = await gamificationRepo.findProfile(userId)
    if (!profile) {
      profile = await gamificationRepo.createProfile(userId)
    }

    const today = new Date(dateStr)
    const p = profile as any
    const lastCheckIn = p.lastCheckIn ? new Date(p.lastCheckIn) : (p.lastActiveDate ? new Date(p.lastActiveDate) : null)

    let newStreak = profile.currentStreak
    if (lastCheckIn) {
      const diffDays = Math.floor(
        (today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (diffDays === 1) {
        newStreak += 1
      } else if (diffDays > 1) {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    const longestStreak = Math.max(newStreak, profile.longestStreak)

    const updated = await gamificationRepo.updateProfile(userId, {
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: dateStr,
    })

    const u = updated as any
    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastCheckIn: u.lastCheckIn?.toISOString() || u.lastActiveDate || null,
    }
  }

  async getAchievements(userId: string, locale: string) {
    const achievements = await gamificationRepo.findAchievements(userId)

    return achievements.map((a) => {
      const userAchievement = a.userAchievements[0]
      const ach = a as any
      return {
        id: a.id,
        key: a.key,
        title: locale === 'es' ? a.titleEs : a.titleEn,
        description: locale === 'es' ? a.descEs : a.descEn,
        icon: ach.icon || null,
        category: a.category,
        rarity: ach.rarity || 'common',
        xpReward: a.xpReward,
        isUnlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt?.toISOString() || null,
      }
    })
  }

  async getAchievementsByCategory(userId: string, locale: string) {
    const achievements = await this.getAchievements(userId, locale)

    // Group by category
    const categories: Record<string, {
      category: string
      total: number
      unlocked: number
      xpEarned: number
      xpTotal: number
      achievements: typeof achievements
    }> = {}

    for (const ach of achievements) {
      const cat = ach.category || 'other'
      if (!categories[cat]) {
        categories[cat] = { category: cat, total: 0, unlocked: 0, xpEarned: 0, xpTotal: 0, achievements: [] }
      }
      categories[cat].total++
      categories[cat].xpTotal += ach.xpReward
      if (ach.isUnlocked) {
        categories[cat].unlocked++
        categories[cat].xpEarned += ach.xpReward
      }
      categories[cat].achievements.push(ach)
    }

    // Sort achievements within each category by rarity
    const rarityOrder: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }
    for (const cat of Object.values(categories)) {
      cat.achievements.sort((a: any, b: any) => (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0))
    }

    return Object.values(categories)
  }

  async seedAchievements() {
    const achievements = [
      // Streaks
      { key: 'streak_3', category: 'streaks', titleEn: '3-Day Streak', titleEs: 'Racha de 3 días', descEn: 'Maintain a 3-day streak', descEs: 'Mantén una racha de 3 días', condition: { type: 'streak_days', value: 3 }, xpReward: 25, rarity: 'common', sortOrder: 1 },
      { key: 'streak_7', category: 'streaks', titleEn: '7-Day Streak', titleEs: 'Racha de 7 días', descEn: 'Maintain a 7-day streak', descEs: 'Mantén una racha de 7 días', condition: { type: 'streak_days', value: 7 }, xpReward: 75, rarity: 'common', sortOrder: 2 },
      { key: 'streak_14', category: 'streaks', titleEn: 'Fortnight Warrior', titleEs: 'Guerrero de 2 Semanas', descEn: 'Maintain a 14-day streak', descEs: 'Mantén una racha de 14 días', condition: { type: 'streak_days', value: 14 }, xpReward: 150, rarity: 'rare', sortOrder: 3 },
      { key: 'streak_30', category: 'streaks', titleEn: 'Monthly Master', titleEs: 'Maestro del Mes', descEn: 'Maintain a 30-day streak', descEs: 'Mantén una racha de 30 días', condition: { type: 'streak_days', value: 30 }, xpReward: 300, rarity: 'epic', sortOrder: 4 },
      { key: 'streak_90', category: 'streaks', titleEn: 'Legendary Dedication', titleEs: 'Dedicación Legendaria', descEn: 'Maintain a 90-day streak', descEs: 'Mantén una racha de 90 días', condition: { type: 'streak_days', value: 90 }, xpReward: 750, rarity: 'legendary', sortOrder: 5 },
      // Tasks
      { key: 'first_task', category: 'tasks', titleEn: 'Task Starter', titleEs: 'Iniciador de Tareas', descEn: 'Complete your first task', descEs: 'Completa tu primera tarea', condition: { type: 'tasks_completed', value: 1 }, xpReward: 10, rarity: 'common', sortOrder: 6 },
      { key: 'task_master', category: 'tasks', titleEn: 'Task Master', titleEs: 'Maestro de Tareas', descEn: 'Complete 10 tasks', descEs: 'Completa 10 tareas', condition: { type: 'tasks_completed', value: 10 }, xpReward: 50, rarity: 'common', sortOrder: 7 },
      { key: 'century', category: 'tasks', titleEn: 'Century Club', titleEs: 'Club del Siglo', descEn: 'Complete 100 tasks', descEs: 'Completa 100 tareas', condition: { type: 'tasks_completed', value: 100 }, xpReward: 250, rarity: 'rare', sortOrder: 8 },
      { key: 'task_legend', category: 'tasks', titleEn: 'Task Legend', titleEs: 'Leyenda de Tareas', descEn: 'Complete 500 tasks', descEs: 'Completa 500 tareas', condition: { type: 'tasks_completed', value: 500 }, xpReward: 1000, rarity: 'legendary', sortOrder: 9 },
      // Habits
      { key: 'first_habit', category: 'habits', titleEn: 'Habit Starter', titleEs: 'Iniciador de Hábitos', descEn: 'Log your first habit', descEs: 'Registra tu primer hábito', condition: { type: 'habit_logs', value: 1 }, xpReward: 10, rarity: 'common', sortOrder: 10 },
      { key: 'habit_week', category: 'habits', titleEn: 'Weekly Warrior', titleEs: 'Guerrero Semanal', descEn: 'Log 7 habit entries', descEs: 'Registra 7 entradas de hábitos', condition: { type: 'habit_logs', value: 7 }, xpReward: 50, rarity: 'common', sortOrder: 11 },
      { key: 'habit_century', category: 'habits', titleEn: 'Habit Centurion', titleEs: 'Centurión de Hábitos', descEn: 'Log 100 habit entries', descEs: 'Registra 100 entradas de hábitos', condition: { type: 'habit_logs', value: 100 }, xpReward: 300, rarity: 'epic', sortOrder: 12 },
      // Pomodoro
      { key: 'first_pomodoro', category: 'pomodoro', titleEn: 'Focus Starter', titleEs: 'Iniciador de Enfoque', descEn: 'Complete your first Pomodoro', descEs: 'Completa tu primer Pomodoro', condition: { type: 'pomodoro_sessions', value: 1 }, xpReward: 10, rarity: 'common', sortOrder: 13 },
      { key: 'flow_state', category: 'pomodoro', titleEn: 'Flow State', titleEs: 'Estado de Flujo', descEn: 'Complete 10 Pomodoro sessions', descEs: 'Completa 10 sesiones Pomodoro', condition: { type: 'pomodoro_sessions', value: 10 }, xpReward: 75, rarity: 'rare', sortOrder: 14 },
      // Milestones
      { key: 'goal_setter', category: 'milestones', titleEn: 'Goal Setter', titleEs: 'Establecedor de Objetivos', descEn: 'Create your first goal', descEs: 'Crea tu primer objetivo', condition: { type: 'goals_created', value: 1 }, xpReward: 25, rarity: 'common', sortOrder: 15 },
      { key: 'quarterly_done', category: 'milestones', titleEn: 'Quarterly Champion', titleEs: 'Campeón del Trimestre', descEn: 'Complete a quarterly goal', descEs: 'Completa un objetivo trimestral', condition: { type: 'quarterly_progress', value: 100 }, xpReward: 500, rarity: 'epic', sortOrder: 16 },
      { key: 'first_1000_xp', category: 'milestones', titleEn: 'Thousand Ascender', titleEs: 'Ascendente de Mil', descEn: 'Earn 1,000 XP', descEs: 'Gana 1,000 XP', condition: { type: 'total_xp', value: 1000 }, xpReward: 100, rarity: 'common', sortOrder: 17 },
      { key: 'ten_k_xp', category: 'milestones', titleEn: 'XP Titan', titleEs: 'Titán XP', descEn: 'Earn 10,000 XP', descEs: 'Gana 10,000 XP', condition: { type: 'total_xp', value: 10000 }, xpReward: 500, rarity: 'rare', sortOrder: 18 },
      // Ranks
      { key: 'rank_d', category: 'ranks', titleEn: 'Rank D Achieved', titleEs: 'Rango D Alcanzado', descEn: 'Reach Rank D', descEs: 'Alcanza el Rango D', condition: { type: 'reach_rank', value: 'D' }, xpReward: 50, rarity: 'common', sortOrder: 19 },
      { key: 'rank_s', category: 'ranks', titleEn: 'S-Rank Legend', titleEs: 'Leyenda de Rango S', descEn: 'Reach Rank S', descEs: 'Alcanza el Rango S', condition: { type: 'reach_rank', value: 'S' }, xpReward: 2000, rarity: 'legendary', sortOrder: 20 },
    ]

    const results = await Promise.all(
      achievements.map((ach) =>
        prisma.achievement.upsert({
          where: { key: ach.key },
          update: {},
          create: ach as any,
        })
      )
    )

    return { seeded: results.length }
  }

  async checkAchievements(userId: string) {
    // Load all achievements with user unlock status
    const achievements = await prisma.achievement.findMany({
      include: { userAchievements: { where: { userId } } },
    })

    const profile = await gamificationRepo.findProfile(userId)

    // Fetch all aggregate counts in parallel
    const [habitLogCount, completedTaskCount, goalCount, pomodoroCount, quarterlyGoals] =
      await Promise.all([
        prisma.habitLog.count({ where: { habit: { userId }, completedCount: { gt: 0 } } }),
        prisma.task.count({ where: { userId, status: 'completed' } }),
        prisma.weeklyGoal.count({ where: { userId } }),
        prisma.pomodoroSession.count({ where: { userId, status: 'completed' } }),
        prisma.quarterlyGoal.findMany({ where: { userId }, select: { progress: true } }),
      ])

    const maxQuarterlyProgress = quarterlyGoals.reduce(
      (max, g) => Math.max(max, g.progress ?? 0),
      0
    )

    // Condition resolver map
    type Resolver = (cond: Record<string, unknown>) => boolean
    const resolvers: Record<string, Resolver> = {
      streak_days: (c) => (profile?.currentStreak ?? 0) >= Number(c.value),
      habit_logs: (c) => habitLogCount >= Number(c.value),
      tasks_completed: (c) => completedTaskCount >= Number(c.value),
      goals_created: (c) => goalCount >= Number(c.value),
      pomodoro_sessions: (c) => pomodoroCount >= Number(c.value),
      total_xp: (c) => (profile?.totalXp ?? 0) >= Number(c.value),
      reach_rank: (c) => rankOrder(profile?.rank ?? 'E') >= rankOrder(String(c.value)),
      quarterly_progress: (c) => maxQuarterlyProgress >= Number(c.value),
    }

    // Check and unlock
    const unlocked = []
    for (const achievement of achievements) {
      if (achievement.userAchievements.length > 0) continue // already unlocked
      const cond = achievement.condition as Record<string, unknown>
      const resolver = resolvers[cond.type as string]
      if (!resolver) continue
      if (!resolver(cond)) continue

      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id, unlockedAt: new Date() },
      })

      // Award XP for unlocking
      if (achievement.xpReward > 0) {
        await this.awardXp(userId, {
          source: 'achievement',
          sourceId: achievement.id,
          amount: achievement.xpReward,
        })
      }

      unlocked.push(achievement)
    }

    return { data: unlocked, count: unlocked.length }
  }

  private async generateDailyChallenges(userId: string, date: string): Promise<void> {
    // Gather user context for AI-personalized challenge generation
    const [profile, recentTasks, activeHabits, recentPomodoros] = await Promise.all([
      gamificationRepo.findProfile(userId),
      prisma.task.findMany({
        where: { userId, status: 'completed', completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { priority: true },
      }),
      prisma.habit.findMany({ where: { userId, isActive: true }, select: { name: true } }),
      prisma.pomodoroSession.count({
        where: { userId, isCompleted: true, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    const streak = profile?.currentStreak ?? 0
    const level = calculateLevel(profile?.totalXp ?? 0).level
    const avgTasksPerDay = Math.round(recentTasks.length / 7)
    const highPriorityPct = recentTasks.length > 0
      ? Math.round(recentTasks.filter(t => t.priority === 'high').length / recentTasks.length * 100)
      : 0

    try {
      const result = await generateObject({
        model: taskModel,
        schema: z.object({
          challenges: z.array(z.object({
            type: z.string().describe('Challenge type identifier'),
            titleEn: z.string().describe('Challenge title in English'),
            titleEs: z.string().describe('Challenge title in Spanish'),
            descEn: z.string().describe('Challenge description in English'),
            descEs: z.string().describe('Challenge description in Spanish'),
            targetValue: z.number().int().min(1).describe('Target to complete'),
            xpReward: z.number().int().min(10).max(100).describe('XP reward'),
          })).min(3).max(5),
        }),
        prompt: `Generate 3-5 personalized daily challenges for a productivity app user.

User profile:
- Level: ${level}, Streak: ${streak} days
- Avg tasks completed/day: ${avgTasksPerDay}
- High priority task rate: ${highPriorityPct}%
- Active habits: ${activeHabits.map(h => h.name).join(', ') || 'none'}
- Pomodoro sessions last week: ${recentPomodoros}

Challenge types available: complete_tasks, complete_high_priority, pomodoro_sessions, habit_streak, habit_all, focus_time

Rules:
- Adapt difficulty to user level (higher level/streak = harder targets)
- If user avoids high priority tasks, include a high_priority challenge
- If user has many habits, include habit_all (complete all habits)
- XP rewards: 20-40 for easy, 40-70 for medium, 70-100 for hard
- Titles should be motivating and varied (not generic)
- Always include at least one task challenge and one habit challenge`,
      })

      await prisma.dailyChallenge.createMany({
        data: result.object.challenges.map(ch => ({
          userId,
          date,
          type: ch.type,
          titleEn: ch.titleEn,
          titleEs: ch.titleEs,
          descEn: ch.descEn,
          descEs: ch.descEs,
          xpReward: ch.xpReward,
          targetValue: ch.targetValue,
          currentValue: 0,
          isCompleted: false,
        })),
        skipDuplicates: true,
      })
    } catch (err) {
      console.error('[CHALLENGE_AI_FALLBACK]', err)
      // Fallback to hardcoded templates if AI fails
      const templates = [
        { type: 'complete_tasks', targetValue: streak >= 14 ? 5 : 3, xpReward: 30, titleEn: 'Task Crusher', titleEs: 'Aplastador de tareas', descEn: `Complete ${streak >= 14 ? 5 : 3} tasks today`, descEs: `Completa ${streak >= 14 ? 5 : 3} tareas hoy` },
        { type: 'pomodoro_sessions', targetValue: streak >= 7 ? 3 : 2, xpReward: 40, titleEn: 'Focus Mode', titleEs: 'Modo enfoque', descEn: `Complete ${streak >= 7 ? 3 : 2} Pomodoro sessions`, descEs: `Completa ${streak >= 7 ? 3 : 2} sesiones Pomodoro` },
        { type: 'habit_streak', targetValue: 1, xpReward: 20, titleEn: 'Habit Builder', titleEs: 'Constructor de hábitos', descEn: 'Log at least one habit today', descEs: 'Registra al menos un hábito hoy' },
      ]
      await prisma.dailyChallenge.createMany({
        data: templates.map(t => ({ userId, date, ...t, currentValue: 0, isCompleted: false })),
        skipDuplicates: true,
      })
    }
  }

  async getChallenges(userId: string, date: string, locale: string) {
    let challenges = await gamificationRepo.findDailyChallenges(userId, date)

    if (challenges.length === 0) {
      await this.generateDailyChallenges(userId, date)
      challenges = await gamificationRepo.findDailyChallenges(userId, date)
    }

    return challenges.map((ch) => ({
      id: ch.id,
      userId: ch.userId,
      date: ch.date,
      type: ch.type,
      title: locale === 'es' ? ch.titleEs : ch.titleEn,
      description: locale === 'es' ? ch.descEs : ch.descEn,
      xpReward: ch.xpReward,
      targetValue: ch.targetValue,
      currentValue: ch.currentValue,
      isCompleted: ch.isCompleted,
    }))
  }

  async updateChallengeProgress(userId: string, challengeId: string, increment: number) {
    const challenge = await gamificationRepo.findDailyChallengeByIdAndUser(challengeId, userId)
    if (!challenge) return null

    const newValue = (challenge.currentValue || 0) + increment
    const isCompleted = newValue >= (challenge.targetValue || 1)

    const updated = await gamificationRepo.updateDailyChallenge(challengeId, {
      currentValue: newValue,
      isCompleted,
    })

    // Award XP if just completed
    if (isCompleted && !challenge.isCompleted) {
      try {
        await gamificationRepo.createXpEvent({
          userId,
          source: 'challenge',
          sourceId: challengeId,
          amount: challenge.xpReward || 10,
          earnedDate: challenge.date,
          metadata: { type: challenge.type },
        })
        await gamificationRepo.updateProfile(userId, {
          totalXp: { increment: challenge.xpReward || 10 },
        })
      } catch (xpError) {
        console.error('[CHALLENGE_XP]', xpError)
      }
    }

    return updated
  }

  async checkAndUpdateRank(userId: string) {
    const profile = await gamificationRepo.findProfile(userId)
    if (!profile) return { previousRank: 'E', newRank: 'E', ranked_up: false }

    const { level } = calculateLevel(profile.totalXp)
    const currentRankIndex = rankOrder(profile.rank)

    // Find highest rank where ALL thresholds are met
    let highestQualified = 0
    for (let i = 0; i < RANK_ORDER.length; i++) {
      const rank = RANK_ORDER[i]!
      const thresholds = RANK_THRESHOLDS[rank]!
      if (
        profile.totalXp >= thresholds.minXp &&
        level >= thresholds.minLevel &&
        profile.currentStreak >= thresholds.minStreak
      ) {
        highestQualified = i
      }
    }

    const previousRank = profile.rank
    const newRank = RANK_ORDER[highestQualified]!

    if (highestQualified > currentRankIndex) {
      await gamificationRepo.updateProfile(userId, { rank: newRank })
      return { previousRank, newRank, ranked_up: true }
    }

    return { previousRank, newRank: previousRank, ranked_up: false }
  }

  async getRankInfo(userId: string) {
    const profile = await gamificationRepo.findProfile(userId)
    if (!profile) {
      return {
        currentRank: 'E',
        nextRank: 'D',
        thresholds: RANK_THRESHOLDS,
        progress: { xp: 0, level: 1, streak: 0 },
      }
    }

    const { level } = calculateLevel(profile.totalXp)
    const currentRankIndex = rankOrder(profile.rank)
    const nextRankIndex = Math.min(currentRankIndex + 1, RANK_ORDER.length - 1)
    const nextRank = currentRankIndex >= RANK_ORDER.length - 1 ? null : RANK_ORDER[nextRankIndex]!

    return {
      currentRank: profile.rank,
      nextRank,
      thresholds: RANK_THRESHOLDS,
      progress: {
        xp: profile.totalXp,
        level,
        streak: profile.currentStreak,
      },
    }
  }

  async detectFatigue(userId: string) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get completed tasks from last 7 days with priority breakdown
    const recentTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: { gte: sevenDaysAgo },
      },
      select: { priority: true, estimatedDurationMinutes: true, completedAt: true },
    })

    if (recentTasks.length < 3) {
      return { fatigueDetected: false, message: 'Not enough recent data', indicators: [] }
    }

    // Calculate priority distribution
    const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0 }
    for (const t of recentTasks) {
      const p = t.priority || 'medium'
      priorityCounts[p] = (priorityCounts[p] || 0) + 1
    }

    const total = recentTasks.length
    const lowPct = (priorityCounts.low || 0) / total
    const highPct = (priorityCounts.high || 0) / total

    // Get XP trend (compare this week vs last week)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const xpEvents = await prisma.xpEvent.findMany({
      where: { userId, createdAt: { gte: fourteenDaysAgo } },
      select: { amount: true, createdAt: true, source: true },
    })

    const thisWeekXp = xpEvents
      .filter(e => e.createdAt && e.createdAt >= sevenDaysAgo)
      .reduce((sum, e) => sum + e.amount, 0)
    const lastWeekXp = xpEvents
      .filter(e => e.createdAt && e.createdAt < sevenDaysAgo)
      .reduce((sum, e) => sum + e.amount, 0)

    // Get habit completion rate this week
    const habitLogs = await prisma.habitLog.count({
      where: { userId, date: { gte: sevenDaysAgo }, completedCount: { gt: 0 } },
    })
    const activeHabits = await prisma.habit.count({ where: { userId, isActive: true } })
    const habitRate = activeHabits > 0 ? habitLogs / (activeHabits * 7) : 0

    // Detect fatigue indicators
    const indicators: Array<{
      type: string
      severity: 'warning' | 'concern' | 'info'
      message: string
    }> = []

    if (lowPct > 0.6) {
      indicators.push({
        type: 'easy_tasks_only',
        severity: 'warning',
        message: `${Math.round(lowPct * 100)}% of completed tasks were low priority`,
      })
    }

    if (highPct < 0.1 && total > 5) {
      indicators.push({
        type: 'avoiding_hard_tasks',
        severity: 'concern',
        message: 'Very few high-priority tasks completed recently',
      })
    }

    if (lastWeekXp > 0 && thisWeekXp < lastWeekXp * 0.5) {
      indicators.push({
        type: 'xp_declining',
        severity: 'warning',
        message: `XP dropped ${Math.round((1 - thisWeekXp / lastWeekXp) * 100)}% from last week`,
      })
    }

    if (habitRate < 0.3 && activeHabits > 0) {
      indicators.push({
        type: 'habits_declining',
        severity: 'concern',
        message: `Only ${Math.round(habitRate * 100)}% habit completion rate this week`,
      })
    }

    const fatigueDetected = indicators.length >= 2 || indicators.some(i => i.severity === 'warning')

    // Generate recommendation if fatigue detected
    let recommendation: string | null = null
    if (fatigueDetected) {
      // Simple recommendation based on indicators
      const hasEasyOnly = indicators.some(i => i.type === 'easy_tasks_only')
      const hasXpDrop = indicators.some(i => i.type === 'xp_declining')

      if (hasEasyOnly) {
        recommendation = 'Try tackling one high-priority task today. Breaking it into smaller steps can make it feel more manageable.'
      } else if (hasXpDrop) {
        recommendation = 'Your momentum has slowed. Consider a short focused session on your most important goal.'
      } else {
        recommendation = 'Take a moment to review your goals and pick one meaningful task to focus on today.'
      }
    }

    return {
      fatigueDetected,
      indicators,
      recommendation,
      stats: {
        tasksCompleted: total,
        priorityBreakdown: priorityCounts,
        thisWeekXp,
        lastWeekXp,
        habitCompletionRate: Math.round(habitRate * 100),
      },
    }
  }

  async getWeeklyXpSummary(userId: string, weekStart?: string) {
    // Default to current week (Monday-Sunday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(monday.getDate() + mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)

    const start = weekStart || monday.toISOString().split('T')[0]!
    const endDate = new Date(start)
    endDate.setDate(endDate.getDate() + 6)
    const end = endDate.toISOString().split('T')[0]!

    const [bySource, totals] = await Promise.all([
      gamificationRepo.aggregateWeeklyXpBySource(userId, start, end),
      gamificationRepo.sumWeeklyXp(userId, start, end),
    ])

    const breakdown = bySource.map((s) => ({
      source: s.source,
      xp: s._sum.amount || 0,
      count: s._count,
    }))

    return {
      weekStart: start,
      weekEnd: end,
      totalXp: totals._sum.amount || 0,
      totalEvents: totals._count,
      breakdown,
    }
  }
}

export const gamificationService = new GamificationService()
