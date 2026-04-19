export const queryKeys = {
  auth: { me: ['auth', 'me'] },
  tasks: {
    all: ['tasks'],
    today: ['tasks', 'today'],
    weekly: ['tasks', 'weekly'],
    grouped: ['tasks', 'grouped'],
    byId: (id: string) => ['tasks', id],
  },
  habits: {
    all: ['habits'],
    stats: ['habits', 'stats'],
    logs: (id: string) => ['habits', id, 'logs'],
  },
  goals: {
    visions: ['goals', 'visions'],
    pillars: ['goals', 'pillars'],
    outcomes: ['goals', 'outcomes'],
    focuses: ['goals', 'focuses'],
    weekly: ['goals', 'weekly'],
    healthSnapshots: ['goals', 'health-snapshots'],
    focusLinks: (focusId: string) => ['goals', 'focus-links', focusId],
  },
  pomodoro: {
    sessions: ['pomodoro', 'sessions'],
    stats: ['pomodoro', 'stats'],
  },
  calendar: {
    accounts: ['calendar', 'accounts'],
    events: ['calendar', 'events'],
  },
  ai: {
    threads: ['ai', 'threads'],
  },
  profile: ['profile'],
  settings: ['settings'],
  subscription: {
    status: ['subscription', 'status'],
    plans: ['subscription', 'plans'],
  },
  notifications: {
    aggregated: ['notifications', 'aggregated'],
  },
  features: {
    resolved: ['features', 'resolved'],
  },
  gamification: {
    profile: ['gamification', 'profile'],
    streak: ['gamification', 'streak'],
    achievements: ['gamification', 'achievements'],
    challenges: (date?: string) => (date ? ['gamification', 'challenges', date] : ['gamification', 'challenges']),
  },
};
