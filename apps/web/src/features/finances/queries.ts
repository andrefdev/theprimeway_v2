import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { financesApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type {
  CreateAccountInput,
  CreateTransactionInput,
  CreateBudgetInput,
  UpdateAccountInput,
} from '@repo/shared/validators'

export const financesQueries = {
  all: () => ['finances'] as const,

  accounts: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'accounts', params],
      queryFn: () => financesApi.listAccounts(params),
      staleTime: CACHE_TIMES.standard,
    }),

  transactions: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'transactions', params],
      queryFn: () => financesApi.listTransactions(params),
      staleTime: CACHE_TIMES.standard,
    }),

  budgets: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'budgets', params],
      queryFn: () => financesApi.listBudgets(params),
      staleTime: CACHE_TIMES.standard,
    }),

  investments: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'investments', params],
      queryFn: () => financesApi.listInvestments(params),
      staleTime: CACHE_TIMES.standard,
    }),

  debts: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'debts', params],
      queryFn: () => financesApi.listDebts(params),
      staleTime: CACHE_TIMES.standard,
    }),

  recurringExpenses: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'recurringExpenses', params],
      queryFn: () => financesApi.listRecurringExpenses(params),
      staleTime: CACHE_TIMES.standard,
    }),

  savingsGoals: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'savingsGoals', params],
      queryFn: () => financesApi.listSavingsGoals(params),
      staleTime: CACHE_TIMES.standard,
    }),

  incomeSources: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...financesQueries.all(), 'incomeSources', params],
      queryFn: () => financesApi.listIncomeSources(params),
      staleTime: CACHE_TIMES.standard,
    }),
}

// Account mutations
export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAccountInput) => financesApi.createAccount(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateAccountInput> }) => financesApi.updateAccount(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Transaction mutations
export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransactionInput) => financesApi.createTransaction(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteTransaction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Budget mutations
export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBudgetInput) => financesApi.createBudget(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteBudget(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Investment mutations
export function useCreateInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financesApi.createInvestment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteInvestment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Debt mutations
export function useCreateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financesApi.createDebt(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteDebt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Recurring expense mutations
export function useCreateRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financesApi.createRecurringExpense(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteRecurringExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Savings goal mutations
export function useCreateSavingsGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financesApi.createSavingsGoal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteSavingsGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

// Income source mutations
export function useCreateIncomeSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financesApi.createIncomeSource(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}

export function useDeleteIncomeSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financesApi.deleteIncomeSource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financesQueries.all() }),
  })
}
