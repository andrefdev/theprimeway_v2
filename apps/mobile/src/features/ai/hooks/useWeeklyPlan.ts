import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/aiService';

export function useWeeklyPlan() {
  return useMutation({
    mutationFn: (weekStartDate: string) => aiService.generateWeeklyPlan(weekStartDate),
  });
}
