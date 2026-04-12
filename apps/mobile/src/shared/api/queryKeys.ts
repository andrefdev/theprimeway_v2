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
  finances: {
    accounts: ['finances', 'accounts'],
    transactions: ['finances', 'transactions'],
    budgets: ['finances', 'budgets'],
    debts: ['finances', 'debts'],
    savings: ['finances', 'savings-goals'],
    income: ['finances', 'income-sources'],
    stats: ['finances', 'stats'],
    recurringExpenses: ['finances', 'recurring-expenses'],
    investments: ['finances', 'investments'],
    investmentsSummary: ['finances', 'investments', 'summary'],
    pendingTransactions: ['finances', 'transactions', 'pending'],
    incomeEstimates: ['finances', 'income-estimates'],
    netWorth: ['finances', 'net-worth'],
  },
  notes: {
    all: ['notes'],
    categories: ['notes', 'categories'],
    byId: (id: string) => ['notes', id],
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
};
