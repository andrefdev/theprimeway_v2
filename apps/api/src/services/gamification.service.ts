import { gamificationRepo } from '../repositories/gamification.repo'

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
    const xpEvent = await gamificationRepo.createXpEvent({
      userId,
      source: body.source,
      sourceId: body.sourceId || null,
      amount: body.amount,
      earnedDate: body.earnedDate || new Date().toISOString().split('T')[0]!,
      metadata: body.metadata || {},
    })

    await gamificationRepo.upsertProfile(
      userId,
      { totalXp: { increment: body.amount } },
      { totalXp: body.amount },
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

  async checkAchievements(_userId: string) {
    // Placeholder — full check logic can be ported later
    return { data: [], count: 0 }
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
