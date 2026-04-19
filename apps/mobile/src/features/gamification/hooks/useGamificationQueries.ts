import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { gamificationService } from '../services/gamificationService';

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.gamification.streak,
    queryFn: () => gamificationService.getStreak(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAchievements(locale?: string) {
  return useQuery({
    queryKey: [...queryKeys.gamification.achievements, locale ?? 'en'],
    queryFn: () => gamificationService.getAchievements(locale),
    staleTime: 1000 * 60 * 10,
  });
}

export function useDailyChallenges(date?: string, locale?: string) {
  return useQuery({
    queryKey: [...queryKeys.gamification.challenges(date), locale ?? 'en'],
    queryFn: () => gamificationService.getChallenges(date, locale),
    staleTime: 1000 * 60,
  });
}
