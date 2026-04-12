import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { goalsService } from '../services/goalsService';
import type {
  VisionFormData,
  OutcomeFormData,
  FocusFormData,
  WeeklyGoalFormData,
} from '../types';

// ============================================================
// Query Hooks
// ============================================================

export function useVisions() {
  return useQuery({
    queryKey: queryKeys.goals.visions,
    queryFn: goalsService.getVisions,
  });
}

export function usePillars() {
  return useQuery({
    queryKey: queryKeys.goals.pillars,
    queryFn: goalsService.getPillars,
  });
}

export function useThreeYearGoals() {
  return useQuery({
    queryKey: queryKeys.goals.pillars,
    queryFn: goalsService.getPillars,
  });
}

export function useOutcomes() {
  return useQuery({
    queryKey: queryKeys.goals.outcomes,
    queryFn: goalsService.getOutcomes,
  });
}

export function useAnnualGoals() {
  return useQuery({
    queryKey: queryKeys.goals.outcomes,
    queryFn: goalsService.getOutcomes,
  });
}

export function useFocuses() {
  return useQuery({
    queryKey: queryKeys.goals.focuses,
    queryFn: goalsService.getFocuses,
  });
}

export function useQuarterlyGoals() {
  return useQuery({
    queryKey: queryKeys.goals.focuses,
    queryFn: goalsService.getFocuses,
  });
}

export function useWeeklyGoals() {
  return useQuery({
    queryKey: queryKeys.goals.weekly,
    queryFn: goalsService.getWeeklyGoals,
  });
}

export function useHealthSnapshots() {
  return useQuery({
    queryKey: queryKeys.goals.healthSnapshots,
    queryFn: goalsService.getHealthSnapshots,
  });
}

export function useFocusLinks(focusId: string) {
  return useQuery({
    queryKey: queryKeys.goals.focusLinks(focusId),
    queryFn: () => goalsService.getFocusLinks(focusId),
    enabled: !!focusId,
  });
}

// ============================================================
// Mutation Hooks
// ============================================================

export function useCreateVision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VisionFormData) => goalsService.createVision(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.visions });
    },
  });
}

export function useUpdateVision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VisionFormData> }) =>
      goalsService.updateVision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.visions });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useDeleteVision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsService.deleteVision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.visions });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useCreatePillar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalsService.createPillar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useCreateThreeYearGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalsService.createPillar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useCreateOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OutcomeFormData) => goalsService.createOutcome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useCreateAnnualGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OutcomeFormData) => goalsService.createOutcome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useUpdateOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OutcomeFormData> }) =>
      goalsService.updateOutcome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useUpdateAnnualGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OutcomeFormData> }) =>
      goalsService.updateOutcome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.pillars });
    },
  });
}

export function useCreateFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FocusFormData) => goalsService.createFocus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.focuses });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
    },
  });
}

export function useCreateQuarterlyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FocusFormData) => goalsService.createFocus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.focuses });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
    },
  });
}

export function useUpdateFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FocusFormData> }) =>
      goalsService.updateFocus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.focuses });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
    },
  });
}

export function useUpdateQuarterlyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FocusFormData> }) =>
      goalsService.updateFocus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.focuses });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.outcomes });
    },
  });
}

export function useCreateWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WeeklyGoalFormData) => goalsService.createWeeklyGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weekly });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.focuses });
    },
  });
}

export function useUpdateWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WeeklyGoalFormData> }) =>
      goalsService.updateWeeklyGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weekly });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.focuses });
    },
  });
}

export function useCreateHealthSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => goalsService.createHealthSnapshot(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.healthSnapshots }),
  });
}
