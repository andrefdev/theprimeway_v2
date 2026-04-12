// ============================================================
// USUARIO Y AUTH
// ============================================================

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  primaryGoal?: string;
}

export interface UserSettings {
  locale: 'en' | 'es';
  theme: 'light' | 'dark';
  timezone: string;
  aiDataSharing: boolean;
}

export interface UserWorkPreferences {
  timeZone: string;
  workStartHour: number;
  workEndHour: number;
  workDays?: number[];
  defaultTaskDurationMinutes?: number;
  maxTasksPerDay?: number;
  overflowStrategy?: string;
}

// ============================================================
// TAREAS
// ============================================================

export type TaskStatus = 'open' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSource = 'manual' | 'autoschedule' | 'dragged' | 'recovered';

export interface Task {
  id: string;
  userId?: string;
  weeklyGoalId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  scheduledDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  isAllDay?: boolean;
  source?: TaskSource;
  backlogState?: string;
  lockedTime?: boolean;
  orderInDay?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// HÁBITOS
// ============================================================

export type FrequencyType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color: string;
  targetFrequency: number;
  frequencyType?: FrequencyType;
  weekDays?: number[];
  isActive: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completedCount: number;
  notes?: string;
}

// ============================================================
// METAS (PRIME ROADMAP)
// ============================================================

export type PillarArea =
  | 'finances'
  | 'career'
  | 'health'
  | 'relationships'
  | 'mindset'
  | 'lifestyle';

export interface PrimeVision {
  id: string;
  title: string;
  narrative?: string;
  status: string;
  pillars: PrimePillar[];
}

export interface PrimePillar {
  id: string;
  visionId?: string;
  area: PillarArea;
  title: string;
  description?: string;
  outcomes: PrimeOutcome[];
}

export interface PrimeOutcome {
  id: string;
  pillarId?: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  focuses: PrimeQuarterFocus[];
}

export interface PrimeQuarterFocus {
  id: string;
  outcomeId?: string;
  year: number;
  quarter: number;
  title: string;
  objectives?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  progress: number;
}

export interface WeeklyGoal {
  id: string;
  quarterFocusId?: string;
  weekStartDate: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'canceled';
  order: number;
}

// ============================================================
// FINANZAS
// ============================================================

export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'cash'
  | 'other';

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  creditLimit?: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  budgetId?: string;
  debtId?: string;
  incomeSourceId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  date: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  transferAccountId?: string;
  tags: string[];
  receiptUrl?: string;
  status: 'pending' | 'reviewed' | 'excluded';
  currency: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  periodType: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  categoryType: 'income' | 'expense';
  isActive: boolean;
}

export interface Debt {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  creditor?: string;
  dueDate?: string;
  interestRate?: number;
  paymentDay?: number;
  installmentAmount?: number;
  installmentCount?: number;
  isRecurring?: boolean;
}

export interface SavingsGoal {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  monthlyContribution?: number;
  status: 'active' | 'completed' | 'paused';
}

export interface IncomeSource {
  id: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
  frequency: string;
  isActive: boolean;
}

export type RecurringExpenseType = 'fixed' | 'variable';
export type RecurringExpenseCategory =
  | 'housing'
  | 'utilities'
  | 'insurance'
  | 'subscriptions'
  | 'transport'
  | 'food'
  | 'health'
  | 'education'
  | 'personal'
  | 'other';

export interface RecurringExpense {
  id: string;
  name: string;
  description?: string;
  type: RecurringExpenseType;
  category: RecurringExpenseCategory;
  amount: number;
  currency: string;
  accountId?: string;
  budgetId?: string;
  paymentDay?: number;
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';
  isAutoPay: boolean;
  isActive: boolean;
  notes?: string;
}

export type InvestmentType =
  | 'stocks'
  | 'bonds'
  | 'etf'
  | 'crypto'
  | 'real_estate'
  | 'mutual_fund'
  | 'other';

export interface Investment {
  id: string;
  name: string;
  ticker?: string;
  investmentType: InvestmentType;
  platform?: string;
  currency: string;
  units?: number;
  purchasePrice?: number;
  currentPrice?: number;
  totalInvested: number;
  currentValue: number;
  unrealizedGain?: number;
  unrealizedGainPercent?: number;
  purchaseDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalGain: number;
  totalGainPercent: number;
  byType: Record<string, { invested: number; currentValue: number }>;
}

// ============================================================
// NOTAS
// ============================================================

export interface Note {
  id: string;
  categoryId?: string;
  title: string;
  content?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  category?: NoteCategory;
}

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// ============================================================
// POMODORO
// ============================================================

export type SessionType = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  sessionType: SessionType;
  plannedDuration: number;
  actualDuration?: number;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
}

// ============================================================
// SUSCRIPCIÓN
// ============================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  maxHabits?: number;
  maxGoals?: number;
  maxNotes?: number;
  maxTasks?: number;
  hasAiAssistant?: boolean;
  hasAdvancedAnalytics?: boolean;
}

export interface UserSubscription {
  id: string;
  planId?: string;
  status?: 'pending' | 'active' | 'paused' | 'cancelled' | 'expired';
  trialEndsAt?: string;
  endsAt?: string;
  nextBillingDate?: string;
  plan?: SubscriptionPlan;
}

// ============================================================
// NOTIFICACIONES
// ============================================================

export interface NotificationPreferences {
  habitReminders: boolean;
  pomodoroAlerts: boolean;
  taskReminders: boolean;
  dailyMotivation: boolean;
  marketingMessages: boolean;
}

// ============================================================
// CALENDARIO
// ============================================================

export interface CalendarAccount {
  id: string;
  provider: string;
  email: string;
  isConnected: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  color?: string;
  calendarId?: string;
}

// ============================================================
// AI CHAT
// ============================================================

export interface AiThread {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// ============================================================
// AUTH
// ============================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}
