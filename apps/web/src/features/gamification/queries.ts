import { queryOptions } from '@tanstack/react-query'
import { gamificationApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const gamificationQueries = {
  all: () => ['gamification'] as const,

  profile: (date?: string) =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'profile', date],
      queryFn: () => gamificationApi.getProfile(date),
      staleTime: CACHE_TIMES.short,
    }),

  xpHistory: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'xp-history', params],
      queryFn: () => gamificationApi.getXpHistory(params),
      staleTime: CACHE_TIMES.standard,
    }),

  dailyXp: (days?: number) =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'daily-xp', days],
      queryFn: () => gamificationApi.getDailyXp(days),
      staleTime: CACHE_TIMES.standard,
    }),

  streak: () =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'streak'],
      queryFn: () => gamificationApi.getStreak(),
      staleTime: CACHE_TIMES.short,
    }),

  achievements: (locale?: string) =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'achievements', locale],
      queryFn: () => gamificationApi.getAchievements(locale),
      staleTime: CACHE_TIMES.standard,
    }),

  achievementsByCategory: (locale?: string) =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'achievements-by-category', locale],
      queryFn: () => gamificationApi.getAchievementsByCategory(locale),
      staleTime: CACHE_TIMES.standard,
    }),

  challenges: (date?: string) =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'challenges', date],
      queryFn: () => gamificationApi.getChallenges(date),
      staleTime: CACHE_TIMES.short,
    }),

  rankInfo: () =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'rank-info'],
      queryFn: () => gamificationApi.getRankInfo(),
      staleTime: CACHE_TIMES.standard,
    }),

  fatigue: () =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'fatigue'],
      queryFn: () => gamificationApi.detectFatigue(),
      staleTime: CACHE_TIMES.standard,
    }),

  levelEvents: () =>
    queryOptions({
      queryKey: [...gamificationQueries.all(), 'level-events'],
      queryFn: () => gamificationApi.getLevelEvents(),
      staleTime: CACHE_TIMES.short,
      refetchInterval: 30 * 1000, // Poll every 30s while app is active
    }),
}
