// Auth
export const AUTH = {
  LOGIN: '/api/auth/mobile/login',
  REGISTER: '/api/auth/mobile/register',
  OAUTH: '/api/auth/mobile/oauth',
  REFRESH: '/api/auth/mobile/refresh',
  LOGOUT: '/api/auth/mobile/logout',
  ME: '/api/auth/mobile/me',
  REQUEST_OTP: '/api/auth/register/request-otp',
  VERIFY_OTP: '/api/auth/register/verify-otp',
} as const;

// Tasks
export const TASKS = {
  BASE: '/api/tasks',
  GROUPED: '/api/tasks/grouped',
  BY_ID: (id: string) => `/api/tasks/${id}`,
  SCHEDULE: (id: string) => `/api/tasks/${id}/schedule`,
  AUTO_ARCHIVE: '/api/tasks/auto-archive',
} as const;

// Habits
export const HABITS = {
  BASE: '/api/habits',
  BY_ID: (id: string) => `/api/habits/${id}`,
  LOGS: (id: string) => `/api/habits/${id}/logs`,
  STATS: '/api/habits/stats',
} as const;

// Goals
export const GOALS = {
  VISIONS: '/api/goals/visions',
  PILLARS: '/api/goals/pillars',
  OUTCOMES: '/api/goals/outcomes',
  FOCUSES: '/api/goals/focuses',
  WEEKLY: '/api/goals/weekly',
  FOCUS_LINKS_TASKS: '/api/goals/focus-links/tasks',
  FOCUS_LINKS_HABITS: '/api/goals/focus-links/habits',
  HEALTH_SNAPSHOTS: '/api/goals/health-snapshots',
} as const;

// Pomodoro
export const POMODORO = {
  SESSIONS: '/api/pomodoro/sessions',
  SESSION_BY_ID: (id: string) => `/api/pomodoro/sessions/${id}`,
  STATS: '/api/pomodoro/stats',
} as const;

// Calendar
export const CALENDAR = {
  ACCOUNTS: '/api/calendar/accounts',
  GOOGLE_EVENTS: '/api/calendar/google/events',
  GOOGLE_CONNECT: '/api/calendar/google/connect',
  SYNC: '/api/calendar/sync',
  CALENDARS: '/api/calendar/calendars',
} as const;

// AI
export const AI = {
  CHAT: '/api/chat',
  THREADS: '/api/ai/threads',
  BRIEFING: '/api/chat/briefing',
  WEEKLY_PLAN: '/api/chat/weekly-plan',
} as const;

// Profile & Settings
export const USER = {
  PROFILE: '/api/profile',
  SETTINGS: '/api/user/settings',
  CURRENCY_SETTINGS: '/api/user/currency-settings',
  WORK_PREFERENCES: '/api/user/work-preferences',
  ONBOARDING: '/api/user/onboarding',
  DELETE: '/api/user/delete',
} as const;

// Notifications
export const NOTIFICATIONS = {
  REGISTER: '/api/notifications/register',
  PREFERENCES: '/api/notifications/preferences',
  AGGREGATED: '/api/notifications/aggregated',
} as const;

// Subscription
export const SUBSCRIPTION = {
  PLANS: '/api/subscriptions/plans',
  STATUS: '/api/subscriptions/status',
  CHECKOUT: '/api/subscriptions/checkout',
} as const;

// Gamification
export const GAMIFICATION = {
  PROFILE: '/api/gamification/profile',
  PROFILE_SETTINGS: '/api/gamification/profile/settings',
  XP: '/api/gamification/xp',
  XP_HISTORY: '/api/gamification/xp/history',
  XP_DAILY: '/api/gamification/xp/daily',
  STREAK: '/api/gamification/streak',
  ACHIEVEMENTS: '/api/gamification/achievements',
  CHALLENGES: '/api/gamification/challenges',
  CHALLENGES_PROGRESS: '/api/gamification/challenges/progress',
  SEED: '/api/gamification/seed',
} as const;

// Features
export const FEATURES = {
  RESOLVED: '/api/features',
} as const;
