import { gamificationRepo } from '../repositories/gamification.repo'
import { prisma } from '../lib/prisma'

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

    return xpEvent
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
      return { currentStreak: 0, longestStreak: 0, lastCheckIn: null }
    }

    const p = profile as any
    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      lastCheckIn: p.lastCheckIn ? p.lastCheckIn.toISOString() : (p.lastActiveDate || null),
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
        xpReward: a.xpReward,
        isUnlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt?.toISOString() || null,
      }
    })
  }

  async checkAchievements(userId: string) {
    const unlockedAchievements = []

    // 1. Check "First Habit" — completed at least 1 habit log
    const habitLogs = await prisma.habitLog.count({
      where: { habit: { userId }, completedCount: { gt: 0 } },
    })

    if (habitLogs > 0) {
      const firstHabit = await prisma.achievement.findUnique({
        where: { key: 'first_habit' },
      })
      if (firstHabit) {
        const existing = await prisma.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: firstHabit.id } },
        })
        if (!existing) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: firstHabit.id, unlockedAt: new Date() },
          })
          unlockedAchievements.push(firstHabit)
        }
      }
    }

    // 2. Check "Streak 7" — current streak >= 7 days
    const profile = await gamificationRepo.findProfile(userId)
    if (profile && profile.currentStreak >= 7) {
      const streak7 = await prisma.achievement.findUnique({
        where: { key: 'streak_7' },
      })
      if (streak7) {
        const existing = await prisma.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: streak7.id } },
        })
        if (!existing) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: streak7.id, unlockedAt: new Date() },
          })
          unlockedAchievements.push(streak7)
        }
      }
    }

    // 3. Check "Task Master" — completed 10+ tasks
    const completedTasks = await prisma.task.count({
      where: { userId, status: 'completed' },
    })

    if (completedTasks >= 10) {
      const taskMaster = await prisma.achievement.findUnique({
        where: { key: 'task_master' },
      })
      if (taskMaster) {
        const existing = await prisma.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: taskMaster.id } },
        })
        if (!existing) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: taskMaster.id, unlockedAt: new Date() },
          })
          unlockedAchievements.push(taskMaster)
        }
      }
    }

    // 4. Check "Goal Setter" — created at least 1 goal
    const goalCount = await prisma.weeklyGoal.count({
      where: { userId },
    })

    if (goalCount > 0) {
      const goalSetter = await prisma.achievement.findUnique({
        where: { key: 'goal_setter' },
      })
      if (goalSetter) {
        const existing = await prisma.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: goalSetter.id } },
        })
        if (!existing) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: goalSetter.id, unlockedAt: new Date() },
          })
          unlockedAchievements.push(goalSetter)
        }
      }
    }

    return { data: unlockedAchievements, count: unlockedAchievements.length }
  }

  async getChallenges(userId: string, date: string, locale: string) {
    const challenges = await gamificationRepo.findDailyChallenges(userId, date)

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
}

export const gamificationService = new GamificationService()
