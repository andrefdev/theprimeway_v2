import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { investmentsService } from '../services/investmentsService';
import type { InvestmentFormData } from '../services/investmentsService';

// ── Query Hooks ─────────────────────────────────────────────

export function useInvestments() {
  return useQuery({
    queryKey: queryKeys.finances.investments,
    queryFn: investmentsService.getInvestments,
  });
}

export function useInvestmentById(id: string) {
  return useQuery({
    queryKey: [...queryKeys.finances.investments, id],
    queryFn: () => investmentsService.getInvestmentById(id),
    enabled: !!id,
  });
}

export function useInvestmentsSummary() {
  return useQuery({
    queryKey: queryKeys.finances.investmentsSummary,
    queryFn: investmentsService.getInvestmentsSummary,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvestmentFormData) => investmentsService.createInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.investments });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.investmentsSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentFormData> }) =>
      investmentsService.updateInvestment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.investments });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.investmentsSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => investmentsService.deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.investments });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.investmentsSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.finances.stats });
    },
  });
}
