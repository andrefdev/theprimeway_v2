import { prisma } from '../../lib/prisma'
import { gamificationRepo } from '../../repositories/gamification.repo'

const RANK_ORDER_MAP: Record<string, number> = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 }

export type AchievementCondition = {
  type: string
  value: number | string
  [key: string]: unknown
}

export interface AchievementContext {
  userId: string
  profile: {
    totalXp: number
    currentStreak: number
    longestStreak: number
    rank: string
  } | null
  counts: {
    habitLogs: number
    completedTasks: number
    completedHighPriorityTasks: number
    goalsCreated: number
    pomodoroSessions: number
    maxQuarterlyProgress: number
    challengesCompleted: number
    notesCreated: number
    booksCompleted: number
  }
}

export interface EvaluationResult {
  progress: number
  target: number
  met: boolean
}

export type ConditionEvaluator = (
  cond: AchievementCondition,
  ctx: AchievementContext,
) => EvaluationResult

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const registry = new Map<string, ConditionEvaluator>()

export function registerCondition(type: string, evaluator: ConditionEvaluator) {
  registry.set(type, evaluator)
}

export function getCondition(type: string): ConditionEvaluator | undefined {
  return registry.get(type)
}

export function listConditionTypes(): string[] {
  return Array.from(registry.keys())
}

export function evaluateCondition(
  cond: AchievementCondition,
  ctx: AchievementContext,
): EvaluationResult | null {
  const evaluator = registry.get(cond.type)
  if (!evaluator) return null
  return evaluator(cond, ctx)
}

// ---------------------------------------------------------------------------
// Context builder — single aggregate query pass per achievement check
// ---------------------------------------------------------------------------
export async function buildAchievementContext(userId: string): Promise<AchievementContext> {
  const profile = await gamificationRepo.findProfile(userId)

  const [
    habitLogs,
    completedTasks,
    completedHighPriorityTasks,
    goalsCreated,
    pomodoroSessions,
    quarterlyGoals,
    challengesCompleted,
    notesCreated,
    booksCompleted,
  ] = await Promise.all([
    prisma.habitLog.count({ where: { userId, completedCount: { gt: 0 } } }),
    prisma.task.count({ where: { userId, status: 'completed' } }),
    prisma.task.count({ where: { userId, status: 'completed', priority: 'high' } }),
    prisma.goal.count({ where: { userId, horizon: 'WEEK' } }),
    prisma.workingSession.count({ where: { userId, kind: 'POMODORO', completed: true } }),
    prisma.goal.findMany({ where: { userId, horizon: 'QUARTER' }, select: { visionContribution: true } }),
    prisma.dailyChallenge.count({ where: { userId, isCompleted: true } }),
    prisma.note.count({ where: { userId } }).catch(() => 0),
    prisma.userBook.count({ where: { userId, status: 'finished' } }).catch(() => 0),
  ])

  const maxQuarterlyProgress = (quarterlyGoals as Array<{ visionContribution: number | null }>).reduce(
    (max, g) => Math.max(max, Math.round((g.visionContribution ?? 0) * 100)),
    0,
  )

  return {
    userId,
    profile: profile
      ? {
          totalXp: profile.totalXp,
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          rank: profile.rank,
        }
      : null,
    counts: {
      habitLogs,
      completedTasks,
      completedHighPriorityTasks,
      goalsCreated,
      pomodoroSessions,
      maxQuarterlyProgress,
      challengesCompleted,
      notesCreated,
      booksCompleted,
    },
  }
}

// ---------------------------------------------------------------------------
// Built-in evaluators
// ---------------------------------------------------------------------------
function numeric(
  target: number | string | undefined,
): number {
  const n = Number(target ?? 0)
  return Number.isFinite(n) ? n : 0
}

function progressResult(progress: number, target: number): EvaluationResult {
  return { progress, target, met: progress >= target }
}

registerCondition('streak_days', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.profile?.currentStreak ?? 0, target)
})

registerCondition('longest_streak', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.profile?.longestStreak ?? 0, target)
})

registerCondition('tasks_completed', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.completedTasks, target)
})

registerCondition('high_priority_tasks_completed', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.completedHighPriorityTasks, target)
})

registerCondition('habit_logs', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.habitLogs, target)
})

registerCondition('goals_created', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.goalsCreated, target)
})

registerCondition('pomodoro_sessions', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.pomodoroSessions, target)
})

registerCondition('total_xp', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.profile?.totalXp ?? 0, target)
})

registerCondition('reach_rank', (c, ctx) => {
  const current = RANK_ORDER_MAP[ctx.profile?.rank ?? 'E'] ?? 0
  const target = RANK_ORDER_MAP[String(c.value)] ?? 0
  return progressResult(current, target)
})

registerCondition('quarterly_progress', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.maxQuarterlyProgress, target)
})

registerCondition('challenges_completed', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.challengesCompleted, target)
})

registerCondition('notes_created', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.notesCreated, target)
})

registerCondition('books_completed', (c, ctx) => {
  const target = numeric(c.value)
  return progressResult(ctx.counts.booksCompleted, target)
})

// ---------------------------------------------------------------------------
// Event → condition types map — which condition types are affected by which
// domain events. Used by handleDomainEvent to re-evaluate only relevant rules.
// ---------------------------------------------------------------------------
import type { GamificationEventType } from './events'

export const EVENT_TO_CONDITIONS: Record<GamificationEventType, string[]> = {
  'task.completed': ['tasks_completed', 'high_priority_tasks_completed'],
  'task.uncompleted': ['tasks_completed', 'high_priority_tasks_completed'],
  'habit.logged': ['habit_logs'],
  'pomodoro.completed': ['pomodoro_sessions'],
  'goal.created': ['goals_created'],
  'xp.awarded': ['total_xp'],
  'streak.updated': ['streak_days', 'longest_streak'],
  'rank.updated': ['reach_rank'],
  'challenge.completed': ['challenges_completed'],
  'note.created': ['notes_created'],
  'book.finished': ['books_completed'],
  'quarterly.progress.updated': ['quarterly_progress'],
}
