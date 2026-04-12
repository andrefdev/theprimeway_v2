/**
 * FEATURES — the single authoritative registry of all feature keys.
 * Adding a new feature = add one entry here. Everything else is driven by this.
 */
export const FEATURES = {
  // Boolean module gates
  AI_ASSISTANT: 'AI_ASSISTANT',
  HEALTH_MODULE: 'HEALTH_MODULE',
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  CUSTOM_THEMES: 'CUSTOM_THEMES',
  EXPORT_DATA: 'EXPORT_DATA',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',

  // Numeric limit gates (the gate fires when usage hits the cap)
  HABITS_LIMIT: 'HABITS_LIMIT',
  GOALS_LIMIT: 'GOALS_LIMIT',
  NOTES_LIMIT: 'NOTES_LIMIT',
  TASKS_LIMIT: 'TASKS_LIMIT',
  POMODORO_DAILY_LIMIT: 'POMODORO_DAILY_LIMIT',
} as const

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES]

/**
 * VERSION_GATES — maps a feature key to the minimum semver that supports it.
 * Clients below this version will have the feature forced off.
 * Keep in code (not DB) — a deploy is required to change version gates anyway.
 */
export const VERSION_GATES: Partial<Record<FeatureKey, string>> = {
  // Example: HABIT_STREAKS: '2.0.0',
} as const
