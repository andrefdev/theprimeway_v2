export const FEATURES = {
  AI_ASSISTANT: 'AI_ASSISTANT',
  HEALTH_MODULE: 'HEALTH_MODULE',
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  CUSTOM_THEMES: 'CUSTOM_THEMES',
  EXPORT_DATA: 'EXPORT_DATA',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',
  HABITS_LIMIT: 'HABITS_LIMIT',
  GOALS_LIMIT: 'GOALS_LIMIT',
  NOTES_LIMIT: 'NOTES_LIMIT',
  TASKS_LIMIT: 'TASKS_LIMIT',
  POMODORO_DAILY_LIMIT: 'POMODORO_DAILY_LIMIT',
} as const;

export type FeatureKey = keyof typeof FEATURES;

export type PlanTier = 'free' | 'trial' | 'premium';

export const PLAN_LIMITS: Record<PlanTier, Record<string, number>> = {
  free: { tasks: 5, habits: 3, goals: 2 },
  trial: { tasks: -1, habits: -1, goals: -1 },
  premium: { tasks: -1, habits: -1, goals: -1 },
};
