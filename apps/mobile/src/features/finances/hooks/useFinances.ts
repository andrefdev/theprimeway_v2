import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { financesService } from '../services/financesService';
import type {
  AccountFormData,
  TransactionFormData,
  BudgetFormData,
  DebtFormData,
  SavingsGoalFormData,
  TransactionQueryParams,
} from '../types';
import type { Transaction } from '@shared/types/models';

// ── Query Hooks ─────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.finances.accounts,
    queryFn: financesService.getAccounts,
  });
}

export function useTransactions(params?: TransactionQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.finances.transactions, params],
    queryFn: () => financesService.getTransactions(params),
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.finances.budgets,
    queryFn: financesService.getBudgets,
  });
}

export function useDebts() {
  return useQuery({
    queryKey: queryKeys.finances.debts,
    queryFn: financesService.getDebts,
  });
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: queryKeys.finances.savings,
    queryFn: financesService.getSavingsGoals,
  });
}

export function useFinanceStats() {
  return useQuery({
    queryKey: queryKeys.finances.stats,
    queryFn: financesService.getStats,
  });
}

export function useIncomeSources() {
  return useQuery({
    queryKey: queryKeys.finances.income,
    queryFn: financesService.getIncomeSources,
  });
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: queryKeys.finances.recurringExpenses,
    queryFn: financesService.getRecurringExpenses,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountFormData) => financesService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionFormData) => financesService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.budgets });
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetFormData) => financesService.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DebtFormData) => financesService.createDebt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.debts });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavingsGoalFormData) => financesService.createSavingsGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.savings });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      financesService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}
