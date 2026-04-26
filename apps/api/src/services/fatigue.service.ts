import { prisma } from '../lib/prisma'

/**
 * Anti-fatigue detector.
 *
 * Motivation (roadmap risk: XP-farming mindset): a user who only completes
 * low-priority tasks isn't growing — they're optimizing for completion count.
 * We surface a gentle signal in the Daily Shutdown ritual so the user can
 * self-correct. Never shaming, never blocking.
 *
 * Signal: over the last 7 days, ratio of completed tasks that are low-priority.
 * Also: ratio of completed goal-unlinked tasks (= drift from vertical alignment).
 */

export interface FatigueSignal {
  windowDays: number
  totalCompleted: number
  lowPriorityCompleted: number
  highPriorityCompleted: number
  goalUnlinkedCompleted: number
  lowPriorityRatio: number
  goalUnlinkedRatio: number
  /** User-facing bucket. 'clear' = no fatigue · 'mild' = watch · 'strong' = active signal. */
  level: 'clear' | 'mild' | 'strong'
  /** Short one-line message safe to render as-is. */
  message: string
}

class FatigueService {
  async analyze(userId: string, windowDays = 7): Promise<FatigueSignal> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    const completed = await prisma.task.findMany({
      where: { userId, status: 'completed', completedAt: { gte: since } },
      select: {
        priority: true,
        goalLinks: { select: { goalId: true }, take: 1 },
      },
    })

    const total = completed.length
    const low = completed.filter((t: any) => t.priority === 'low').length
    const high = completed.filter((t: any) => t.priority === 'high').length
    const unlinked = completed.filter((t: any) => t.goalLinks.length === 0).length

    const lowRatio = total === 0 ? 0 : low / total
    const unlinkedRatio = total === 0 ? 0 : unlinked / total

    let level: FatigueSignal['level'] = 'clear'
    let message = 'No fatigue signal detected.'

    // Need enough samples to be meaningful.
    if (total >= 5) {
      if (lowRatio >= 0.7 || (unlinkedRatio >= 0.7 && high === 0)) {
        level = 'strong'
        message =
          unlinkedRatio >= 0.7
            ? `Most of your ${total} recent completions aren't linked to a goal. A small high-priority task tomorrow would shift that.`
            : `${Math.round(lowRatio * 100)}% of recent completions were low-priority. Try picking one high-priority task tomorrow.`
      } else if (lowRatio >= 0.5 || unlinkedRatio >= 0.5) {
        level = 'mild'
        message =
          unlinkedRatio >= 0.5
            ? `About half your completions lately don't serve a goal — worth pausing on that before planning tomorrow.`
            : `Lots of low-priority wins recently. Not bad, just worth noticing.`
      }
    }

    return {
      windowDays,
      totalCompleted: total,
      lowPriorityCompleted: low,
      highPriorityCompleted: high,
      goalUnlinkedCompleted: unlinked,
      lowPriorityRatio: Math.round(lowRatio * 100) / 100,
      goalUnlinkedRatio: Math.round(unlinkedRatio * 100) / 100,
      level,
      message,
    }
  }
}

export const fatigueService = new FatigueService()
