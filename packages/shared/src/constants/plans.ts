/**
 * PLAN_LIMITS — subscription tier defaults for all feature flags and limits.
 * Aligns with backend tiers (free, trial, premium) and maps to FeatureKey values.
 * Used for local UI hints; server resolution is the source of truth.
 *
 * Numeric limits: -1 = unlimited, otherwise capped at the value.
 * Boolean features: true/false for tier access.
 */

import { FEATURES, type FeatureKey } from './features'

export type PlanTier = 'free' | 'trial' | 'premium'

/**
 * Default feature set per plan tier.
 * FeatureKey → limit value or boolean enabled state.
 * This matches the SubscriptionPlan DB schema columns.
 */
export const PLAN_LIMITS = {
  free: {
    [FEATURES.HABITS_LIMIT]: 5,
    [FEATURES.GOALS_LIMIT]: 3,
    [FEATURES.NOTES_LIMIT]: 10,
    [FEATURES.TASKS_LIMIT]: 20,
    [FEATURES.POMODORO_DAILY_LIMIT]: 10,
    [FEATURES.AI_ASSISTANT]: false,
    [FEATURES.READING_MODULE]: false,
    [FEATURES.FINANCES_MODULE]: false,
    [FEATURES.NOTES_MODULE]: false,
    [FEATURES.HEALTH_MODULE]: false,
    [FEATURES.ADVANCED_ANALYTICS]: false,
    [FEATURES.CUSTOM_THEME_CREATION]: false,
    [FEATURES.CUSTOM_THEMES]: false,
    [FEATURES.EXPORT_DATA]: false,
    [FEATURES.PRIORITY_SUPPORT]: false,
  },
  trial: {
    [FEATURES.HABITS_LIMIT]: -1,    // unlimited during trial
    [FEATURES.GOALS_LIMIT]: -1,
    [FEATURES.NOTES_LIMIT]: -1,
    [FEATURES.TASKS_LIMIT]: -1,
    [FEATURES.POMODORO_DAILY_LIMIT]: -1,
    [FEATURES.AI_ASSISTANT]: true,
    [FEATURES.READING_MODULE]: true,
    [FEATURES.FINANCES_MODULE]: true,
    [FEATURES.NOTES_MODULE]: true,
    [FEATURES.HEALTH_MODULE]: true,
    [FEATURES.ADVANCED_ANALYTICS]: true,
    [FEATURES.CUSTOM_THEME_CREATION]: true,
    [FEATURES.CUSTOM_THEMES]: true,
    [FEATURES.EXPORT_DATA]: true,
    [FEATURES.PRIORITY_SUPPORT]: true,
  },
  premium: {
    [FEATURES.HABITS_LIMIT]: -1,    // unlimited
    [FEATURES.GOALS_LIMIT]: -1,
    [FEATURES.NOTES_LIMIT]: -1,
    [FEATURES.TASKS_LIMIT]: -1,
    [FEATURES.POMODORO_DAILY_LIMIT]: -1,
    [FEATURES.AI_ASSISTANT]: true,
    [FEATURES.READING_MODULE]: true,
    [FEATURES.FINANCES_MODULE]: true,
    [FEATURES.NOTES_MODULE]: true,
    [FEATURES.HEALTH_MODULE]: true,
    [FEATURES.ADVANCED_ANALYTICS]: true,
    [FEATURES.CUSTOM_THEME_CREATION]: true,
    [FEATURES.CUSTOM_THEMES]: true,
    [FEATURES.EXPORT_DATA]: true,
    [FEATURES.PRIORITY_SUPPORT]: true,
  },
} as const satisfies Record<PlanTier, Record<FeatureKey, number | boolean>>

export type PlanLimitValue = (typeof PLAN_LIMITS)[PlanTier][FeatureKey]
