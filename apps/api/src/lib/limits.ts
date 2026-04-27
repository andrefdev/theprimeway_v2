import { FEATURES, type FeatureKey } from '@repo/shared/constants';
import type { SubscriptionPlan } from '@prisma/client';
import { prisma } from './prisma';
import { getCurrentUsage } from './usage';

export interface LimitConfig {
  featureKey: FeatureKey;
  currentUsage: number;
}

/** Maps limit-type features to their SubscriptionPlan field names and usage stat fields */
const LIMIT_MAPPING = {
  [FEATURES.HABITS_LIMIT]: {
    planField: 'maxHabits',
    usageField: 'currentHabits',
    errorMessage: 'You have reached your habit limit for this plan.',
  },
  [FEATURES.GOALS_LIMIT]: {
    planField: 'maxGoals',
    usageField: 'currentGoals',
    errorMessage: 'You have reached your goal limit for this plan.',
  },
  [FEATURES.TASKS_LIMIT]: {
    planField: 'maxTasks',
    usageField: 'currentTasks',
    errorMessage: 'You have reached your task limit for this plan.',
  },
  [FEATURES.POMODORO_DAILY_LIMIT]: {
    planField: 'maxPomodoroSessionsDaily',
    usageField: 'dailyPomodoroSessions',
    errorMessage: 'You have reached your daily pomodoro limit for this plan.',
  },
  [FEATURES.BRAIN_ENTRIES_LIMIT]: {
    planField: 'maxBrainEntries',
    usageField: 'currentBrainEntries',
    errorMessage: 'You have reached your brain entries limit for this plan.',
  },
};

export class LimitExceededError extends Error {
  constructor(message: string, public limitType: FeatureKey) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

/**
 * Check if a user has reached their limit for a feature.
 * Returns true if limit is exceeded, false otherwise.
 * -1 means unlimited.
 */
export function isLimitExceeded(
  limit: number | null | undefined,
  currentUsage: number
): boolean {
  if (limit === null || limit === undefined) return false;
  if (limit === -1) return false; // unlimited
  return currentUsage >= limit;
}

/**
 * Validate a user's limit before creating a new item.
 * Throws LimitExceededError if limit is exceeded.
 */
export function validateLimit(
  featureKey: FeatureKey,
  plan: SubscriptionPlan,
  currentUsage: number
): void {
  const mapping = LIMIT_MAPPING[featureKey as keyof typeof LIMIT_MAPPING];
  if (!mapping) {
    // Not a limit-type feature
    return;
  }

  const limit = (plan[mapping.planField as keyof SubscriptionPlan] as number | null) ?? null;

  if (isLimitExceeded(limit, currentUsage)) {
    throw new LimitExceededError(mapping.errorMessage, featureKey);
  }
}

export function getLimitInfo(featureKey: FeatureKey) {
  return LIMIT_MAPPING[featureKey as keyof typeof LIMIT_MAPPING];
}

/**
 * Resolve user's plan, count current usage from real data, and throw
 * LimitExceededError if at/over the cap. Use before any "create" path.
 */
export async function enforceLimit(userId: string, featureKey: FeatureKey): Promise<void> {
  const subscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });
  const plan = subscription?.plan;
  if (!plan) return;
  const currentUsage = await getCurrentUsage(userId, featureKey);
  validateLimit(featureKey, plan, currentUsage);
}
