import { prisma } from '../../lib/prisma'
import {
  EVENT_TO_CONDITIONS,
  buildAchievementContext,
  evaluateCondition,
  type AchievementCondition,
} from './condition-registry'
import { gamificationEvents, type GamificationEventType, type GamificationEventPayload } from './events'

/**
 * Re-evaluate only the achievements whose conditions are affected by `eventType`.
 * Upserts UserAchievementProgress. On first `met` transition, creates UserAchievement
 * and awards XP.
 */
export async function handleDomainEvent(
  eventType: GamificationEventType,
  payload: GamificationEventPayload,
) {
  const { userId } = payload
  const affectedConditionTypes = EVENT_TO_CONDITIONS[eventType] ?? []
  if (affectedConditionTypes.length === 0) return

  const achievements = await prisma.achievement.findMany({
    where: { condition: { not: undefined } },
    include: { userAchievements: { where: { userId } } },
  })

  const relevant = achievements.filter((a: any) => {
    const cond = a.condition as AchievementCondition | null
    return cond && affectedConditionTypes.includes(cond.type)
  })
  if (relevant.length === 0) return

  const ctx = await buildAchievementContext(userId)

  for (const achievement of relevant as any[]) {
    const cond = achievement.condition as AchievementCondition
    const result = evaluateCondition(cond, ctx)
    if (!result) continue

    const alreadyUnlocked = achievement.userAchievements.length > 0

    await prisma.userAchievementProgress.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      update: { value: result.progress, target: result.target, met: result.met },
      create: {
        userId,
        achievementId: achievement.id,
        value: result.progress,
        target: result.target,
        met: result.met,
      },
    })

    if (result.met && !alreadyUnlocked) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      })
      if (achievement.xpReward > 0) {
        // Lazy import to avoid circular dep with gamification.service
        const { gamificationService } = await import('../gamification.service')
        await gamificationService.awardXp(userId, {
          source: 'achievement_unlock',
          sourceId: achievement.id,
          amount: achievement.xpReward,
          metadata: { achievementName: achievement.name },
        })
      }
    }
  }
}

let subscribed = false
export function subscribeGamificationHandlers() {
  if (subscribed) return
  subscribed = true

  const types: GamificationEventType[] = [
    'task.completed',
    'task.uncompleted',
    'habit.logged',
    'pomodoro.completed',
    'goal.created',
    'xp.awarded',
    'streak.updated',
    'rank.updated',
    'challenge.completed',
    'note.created',
    'book.finished',
    'quarterly.progress.updated',
  ]

  for (const t of types) {
    gamificationEvents.on(t, async (payload) => {
      try {
        await handleDomainEvent(t, payload)
      } catch (err) {
        console.error(`[gamification] event ${t} handler failed:`, err)
      }
    })
  }
}
