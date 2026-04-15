// Shared constants across all apps

// --- Tasks ---
export const TASK_STATUSES = ['open', 'completed', 'archived'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

// --- Habits ---
export const HABIT_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const
export const HABIT_STATUSES = ['active', 'paused', 'archived'] as const
export { LIFE_PILLARS, CATEGORY_TO_PILLAR, type LifePillarId } from './habits'

// --- Pomodoro ---
export const POMODORO_SESSION_TYPES = ['focus', 'short_break', 'long_break'] as const
export const POMODORO_DEFAULTS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
} as const

// --- Finances ---
export const FINANCE_ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'investment', 'cash', 'other'] as const
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const
export const BUDGET_PERIODS = ['weekly', 'monthly', 'quarterly', 'yearly'] as const
export const SUPPORTED_CURRENCIES = ['USD', 'PEN'] as const
export const DEFAULT_BASE_CURRENCY = 'USD'

// --- Reading ---
export const READING_STATUSES = ['to_read', 'reading', 'completed', 'on_hold', 'dropped'] as const
export const READING_PRIORITIES = ['low', 'medium', 'high'] as const

// --- Goals ---
export const GOAL_STATUSES = ['not-started', 'in-progress', 'completed', 'on-hold'] as const
export const GOAL_TYPES = ['short-term', 'long-term'] as const
export const PRIME_PILLARS = [
  'finances',
  'career',
  'health',
  'relationships',
  'mindset',
  'lifestyle',
] as const
export {
  GOAL_TEMPLATE_CATEGORIES,
  GOAL_TEMPLATES,
  type GoalTemplateCategory,
  type GoalTemplate,
} from './goal-templates'

// --- Gamification ---
export const GAMIFICATION_XP_SOURCES = [
  'task_completed',
  'habit_completed',
  'streak_maintained',
  'challenge_completed',
  'goal_completed',
  'pomodoro_completed',
  'book_finished',
  'daily_login',
] as const

// --- Localization ---
export const SUPPORTED_LOCALES = ['en', 'es'] as const
export const DEFAULT_LOCALE = 'en'

// --- Auth ---
export const AUTH_TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'

// --- Cache times (milliseconds) for React Query ---
export const CACHE_TIMES = {
  short: 30 * 1000,         // 30s — rapidly changing data (gamification, streaks)
  standard: 5 * 60 * 1000,  // 5min — most features (tasks, habits, notes)
  long: 30 * 60 * 1000,     // 30min — slow-changing data (AI insights, settings)
  day: 24 * 60 * 60 * 1000, // 24h — static data (exchange rates, plans)
} as const

export const GC_TIMES = {
  standard: 10 * 60 * 1000,  // 10min
  long: 60 * 60 * 1000,      // 1h
} as const

// --- Features (feature flags & module activation) ---
export { FEATURES, VERSION_GATES, type FeatureKey } from './features'

// --- Subscription plans ---
export { PLAN_LIMITS, type PlanTier, type PlanLimitValue } from './plans'
