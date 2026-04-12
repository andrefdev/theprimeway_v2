import { apiClient } from '@shared/api/client';
import { FINANCES } from '@shared/api/endpoints';
import type {
  FinanceAccount,
  Transaction,
  Budget,
  Debt,
  SavingsGoal,
  IncomeSource,
  RecurringExpense,
} from '@shared/types/models';
import type { PaginatedResponse } from '@shared/types/api';
import type {
  AccountFormData,
  TransactionFormData,
  BudgetFormData,
  DebtFormData,
  SavingsGoalFormData,
  RecurringExpenseFormData,
  TransactionQueryParams,
  FinanceStats,
} from '../types';

export const financesService = {
  // ── Accounts ──────────────────────────────────────────────
  getAccounts: async (): Promise<FinanceAccount[]> => {
    const { data } = await apiClient.get<{ data: FinanceAccount[] }>(FINANCES.ACCOUNTS);
    return data.data ?? [];
  },

  createAccount: async (accountData: AccountFormData): Promise<FinanceAccount> => {
    const { data } = await apiClient.post<{ data: FinanceAccount }>(
      FINANCES.ACCOUNTS,
      accountData,
    );
    return data.data;
  },

  // ── Transactions ──────────────────────────────────────────
  getTransactions: async (
    params?: TransactionQueryParams,
  ): Promise<PaginatedResponse<Transaction>> => {
    const { data } = await apiClient.get<PaginatedResponse<Transaction>>(FINANCES.TRANSACTIONS, {
      params,
    });
    return data;
  },

  createTransaction: async (transactionData: TransactionFormData): Promise<Transaction> => {
    const { data } = await apiClient.post<{ data: Transaction }>(
      FINANCES.TRANSACTIONS,
      transactionData,
    );
    return data.data;
  },

  // ── Budgets ───────────────────────────────────────────────
  getBudgets: async (): Promise<Budget[]> => {
    const { data } = await apiClient.get<{ data: Budget[] }>(FINANCES.BUDGETS);
    return data.data ?? [];
  },

  createBudget: async (budgetData: BudgetFormData): Promise<Budget> => {
    const { data } = await apiClient.post<{ data: Budget }>(FINANCES.BUDGETS, budgetData);
    return data.data;
  },

  // ── Debts ─────────────────────────────────────────────────
  getDebts: async (): Promise<Debt[]> => {
    const { data } = await apiClient.get<{ data: Debt[] }>(FINANCES.DEBTS);
    return data.data ?? [];
  },

  createDebt: async (debtData: DebtFormData): Promise<Debt> => {
    const { data } = await apiClient.post<{ data: Debt }>(FINANCES.DEBTS, debtData);
    return data.data;
  },

  // ── Savings Goals ─────────────────────────────────────────
  getSavingsGoals: async (): Promise<SavingsGoal[]> => {
    const { data } = await apiClient.get<{ data: SavingsGoal[] }>(FINANCES.SAVINGS);
    return data.data ?? [];
  },

  createSavingsGoal: async (goalData: SavingsGoalFormData): Promise<SavingsGoal> => {
    const { data } = await apiClient.post<{ data: SavingsGoal }>(
      FINANCES.SAVINGS,
      goalData,
    );
    return data.data;
  },

  // ── Stats ─────────────────────────────────────────────────
  getStats: async (): Promise<FinanceStats> => {
    const { data } = await apiClient.get<{ data: FinanceStats }>(FINANCES.STATS);
    return data.data;
  },

  // ── Income Sources ────────────────────────────────────────
  getIncomeSources: async (): Promise<IncomeSource[]> => {
    const { data } = await apiClient.get<{ data: IncomeSource[] }>(FINANCES.INCOME);
    return data.data ?? [];
  },

  // ── Recurring Expenses ──────────────────────────────────
  getRecurringExpenses: async (): Promise<RecurringExpense[]> => {
    const { data } = await apiClient.get<{ data: RecurringExpense[] }>(
      FINANCES.RECURRING_EXPENSES,
    );
    return data.data ?? [];
  },

  createRecurringExpense: async (
    expenseData: RecurringExpenseFormData,
  ): Promise<RecurringExpense> => {
    const { data } = await apiClient.post<{ data: RecurringExpense }>(
      FINANCES.RECURRING_EXPENSES,
      expenseData,
    );
    return data.data;
  },

  // ── Update Transaction ─────────────────────────────────────
  updateTransaction: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    const { data: res } = await apiClient.patch<{ data: Transaction }>(
      `${FINANCES.TRANSACTIONS}/${id}`,
      data,
    );
    return res.data;
  },
};
