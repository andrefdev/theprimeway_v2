import { z } from 'zod/v4';

// ============================================================
// ACCOUNT SCHEMAS
// ============================================================

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash', 'other']),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  initialBalance: z.number().default(0),
  creditLimit: z.number().optional(),
});

export type AccountFormData = z.infer<typeof accountSchema>;

// ============================================================
// TRANSACTION SCHEMAS
// ============================================================

export const transactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  budgetId: z.string().optional(),
  debtId: z.string().optional(),
  incomeSourceId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  transferAccountId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  currency: z.string().default('USD'),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

// ============================================================
// BUDGET SCHEMAS
// ============================================================

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  description: z.string().optional(),
  periodType: z.string().min(1, 'Period type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalAmount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('USD'),
  categoryType: z.enum(['income', 'expense']),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

// ============================================================
// DEBT SCHEMAS
// ============================================================

export const debtSchema = z.object({
  name: z.string().min(1, 'Debt name is required'),
  description: z.string().optional(),
  totalAmount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('USD'),
  creditor: z.string().optional(),
  dueDate: z.string().optional(),
  interestRate: z.number().min(0).optional(),
  paymentDay: z.number().min(1).max(31).optional(),
  installmentAmount: z.number().positive().optional(),
  installmentCount: z.number().int().positive().optional(),
  isRecurring: z.boolean().default(false),
});

export type DebtFormData = z.infer<typeof debtSchema>;

// ============================================================
// SAVINGS GOAL SCHEMAS
// ============================================================

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  description: z.string().optional(),
  accountId: z.string().optional(),
  targetAmount: z.number().positive('Target amount must be greater than 0'),
  currentAmount: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  targetDate: z.string().optional(),
  monthlyContribution: z.number().min(0).optional(),
});

export type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

// ============================================================
// RECURRING EXPENSE SCHEMAS
// ============================================================

export const recurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['fixed', 'variable']),
  category: z.enum([
    'housing',
    'utilities',
    'insurance',
    'subscriptions',
    'transport',
    'food',
    'health',
    'education',
    'personal',
    'other',
  ]),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('USD'),
  accountId: z.string().optional(),
  budgetId: z.string().optional(),
  paymentDay: z.number().min(1).max(31).optional(),
  frequency: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']),
  isAutoPay: z.boolean().default(false),
  notes: z.string().optional(),
});

export type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>;

// ============================================================
// QUERY PARAMS
// ============================================================

export interface TransactionQueryParams {
  page?: number;
  pageSize?: number;
  accountId?: string;
  type?: 'income' | 'expense' | 'transfer';
  status?: 'pending' | 'reviewed' | 'excluded';
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// STATS RESPONSE
// ============================================================

export interface FinanceStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  /** Always reflects the current calendar month */
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  currency: string;
  accountsCount?: number;
  budgetsCount?: number;
  savingsProgress?: number;
  pendingTransactionsCount?: number;
  netWorth?: number;
  totalAssets?: number;
  totalLiabilities?: number;
}
