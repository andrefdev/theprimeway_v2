import { api } from '../../lib/api-client'
import type { FinanceAccount, Transaction, Budget } from '@repo/shared/types'
import type {
  CreateAccountInput,
  CreateTransactionInput,
  CreateBudgetInput,
  UpdateAccountInput,
  UpdateTransactionInput,
  UpdateBudgetInput,
} from '@repo/shared/validators'

interface ListResponse<T> {
  data: T[]
  count: number
}

// Local types for features not yet in @repo/shared
export interface InvestmentHolding {
  id: string
  userId: string
  name: string
  ticker?: string | null
  category?: string | null
  quantity: number
  avgCostPrice: number
  currentPrice: number
  currency: string
  accountId?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface Debt {
  id: string
  userId: string
  name: string
  description?: string | null
  category?: string | null
  totalAmount: number
  paidAmount: number
  currency: string
  creditor?: string | null
  dueDate?: string | null
  interestRate?: number | null
  isActive: boolean
  paymentDay?: number | null
  installmentAmount?: number | null
  installmentCount?: number | null
  nextPaymentDate?: string | null
  debtType?: string | null
  createdAt: string
  updatedAt: string
}

export interface RecurringExpense {
  id: string
  userId: string
  name: string
  description?: string | null
  type?: string | null
  category?: string | null
  frequency: string
  baseAmount: number
  amount: number
  currency: string
  dueDay?: number | null
  isAutoPay: boolean
  budgetId?: string | null
  accountId?: string | null
  isActive: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  currency: string
  targetDate?: string | null
  accountId?: string | null
  createdAt: string
  updatedAt: string
}

export interface IncomeSource {
  id: string
  userId: string
  name: string
  baseAmount: number
  amount: number
  currency: string
  frequency: string
  category?: string | null
  type?: string | null
  isVariable: boolean
  isActive: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export const financesApi = {
  // Accounts
  listAccounts: (params?: Record<string, string>) =>
    api.get<ListResponse<FinanceAccount>>('/finances/accounts', { params }).then((r) => r.data),

  createAccount: (data: CreateAccountInput) =>
    api.post<FinanceAccount>('/finances/accounts', data).then((r) => r.data),

  updateAccount: (id: string, data: Partial<UpdateAccountInput>) =>
    api.patch<FinanceAccount>(`/finances/accounts/${id}`, data).then((r) => r.data),

  deleteAccount: (id: string) =>
    api.delete(`/finances/accounts/${id}`).then((r) => r.data),

  // Transactions
  listTransactions: (params?: Record<string, string>) =>
    api.get<ListResponse<Transaction>>('/finances/transactions', { params }).then((r) => r.data),

  createTransaction: (data: CreateTransactionInput) =>
    api.post<Transaction>('/finances/transactions', data).then((r) => r.data),

  updateTransaction: (id: string, data: Partial<UpdateTransactionInput>) =>
    api.patch<Transaction>(`/finances/transactions/${id}`, data).then((r) => r.data),

  deleteTransaction: (id: string) =>
    api.delete(`/finances/transactions/${id}`).then((r) => r.data),

  // Budgets
  listBudgets: (params?: Record<string, string>) =>
    api.get<ListResponse<Budget>>('/finances/budgets', { params }).then((r) => r.data),

  createBudget: (data: CreateBudgetInput) =>
    api.post<Budget>('/finances/budgets', data).then((r) => r.data),

  updateBudget: (id: string, data: Partial<UpdateBudgetInput>) =>
    api.patch<Budget>(`/finances/budgets/${id}`, data).then((r) => r.data),

  deleteBudget: (id: string) =>
    api.delete(`/finances/budgets/${id}`).then((r) => r.data),

  // Investments
  listInvestments: (params?: Record<string, string>) =>
    api.get<ListResponse<InvestmentHolding>>('/finances/investments', { params }).then((r) => r.data),
  createInvestment: (data: Record<string, unknown>) =>
    api.post<{ data: InvestmentHolding }>('/finances/investments', data).then((r) => r.data),
  updateInvestment: (id: string, data: Record<string, unknown>) =>
    api.patch<{ data: InvestmentHolding }>(`/finances/investments/${id}`, data).then((r) => r.data),
  deleteInvestment: (id: string) =>
    api.delete(`/finances/investments/${id}`).then((r) => r.data),

  // Debts
  listDebts: (params?: Record<string, string>) =>
    api.get<ListResponse<Debt>>('/finances/debts', { params }).then((r) => r.data),
  createDebt: (data: Record<string, unknown>) =>
    api.post<{ data: Debt }>('/finances/debts', data).then((r) => r.data),
  updateDebt: (id: string, data: Record<string, unknown>) =>
    api.patch<{ data: Debt }>(`/finances/debts/${id}`, data).then((r) => r.data),
  deleteDebt: (id: string) =>
    api.delete(`/finances/debts/${id}`).then((r) => r.data),

  // Recurring Expenses
  listRecurringExpenses: (params?: Record<string, string>) =>
    api.get<ListResponse<RecurringExpense>>('/finances/recurring-expenses', { params }).then((r) => r.data),
  createRecurringExpense: (data: Record<string, unknown>) =>
    api.post<{ data: RecurringExpense }>('/finances/recurring-expenses', data).then((r) => r.data),
  updateRecurringExpense: (id: string, data: Record<string, unknown>) =>
    api.patch<{ data: RecurringExpense }>(`/finances/recurring-expenses/${id}`, data).then((r) => r.data),
  deleteRecurringExpense: (id: string) =>
    api.delete(`/finances/recurring-expenses/${id}`).then((r) => r.data),

  // Savings Goals
  listSavingsGoals: (params?: Record<string, string>) =>
    api.get<ListResponse<SavingsGoal>>('/finances/savings-goals', { params }).then((r) => r.data),
  createSavingsGoal: (data: Record<string, unknown>) =>
    api.post<{ data: SavingsGoal }>('/finances/savings-goals', data).then((r) => r.data),
  updateSavingsGoal: (id: string, data: Record<string, unknown>) =>
    api.patch<{ data: SavingsGoal }>(`/finances/savings-goals/${id}`, data).then((r) => r.data),
  deleteSavingsGoal: (id: string) =>
    api.delete(`/finances/savings-goals/${id}`).then((r) => r.data),

  // Income Sources
  listIncomeSources: (params?: Record<string, string>) =>
    api.get<ListResponse<IncomeSource>>('/finances/income-sources', { params }).then((r) => r.data),
  createIncomeSource: (data: Record<string, unknown>) =>
    api.post<{ data: IncomeSource }>('/finances/income-sources', data).then((r) => r.data),
  updateIncomeSource: (id: string, data: Record<string, unknown>) =>
    api.patch<{ data: IncomeSource }>(`/finances/income-sources/${id}`, data).then((r) => r.data),
  deleteIncomeSource: (id: string) =>
    api.delete(`/finances/income-sources/${id}`).then((r) => r.data),

  // Transaction Import
  importTransaction: (data: Record<string, unknown>) =>
    api.post<{ data: Transaction }>('/finances/transactions/import', data).then((r) => r.data),
  importBatch: (data: Record<string, unknown>) =>
    api.post<{ imported: number }>('/finances/transactions/import-batch', data).then((r) => r.data),
}
