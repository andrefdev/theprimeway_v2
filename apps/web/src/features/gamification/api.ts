import { api } from '../../lib/api-client'
import type {
  GamificationProfile,
  XpEvent,
  DailyXpSnapshot,
  Achievement,
  DailyChallenge,
} from '@repo/shared/types'

interface ListResponse<T> {
  data: T[]
  count: number
}

export const gamificationApi = {
  getProfile: (date?: string) =>
    api.get<{ data: GamificationProfile }>('/gamification/profile', {
      params: date ? { date } : undefined,
    }).then((r) => r.data),

  getXpHistory: (params?: Record<string, string>) =>
    api.get<ListResponse<XpEvent>>('/gamification/xp/history', { params }).then((r) => r.data),

  getDailyXp: (days?: number) =>
    api.get<ListResponse<DailyXpSnapshot>>('/gamification/xp/daily', {
      params: days ? { days } : undefined,
    }).then((r) => r.data),

  getStreak: () =>
    api.get<{
      data: {
        currentStreak: number
        longestStreak: number
        lastActiveDate: string | null
        heatmap: Array<{ date: string; totalXp: number; goalMet: boolean }>
      }
    }>('/gamification/streak').then((r) => r.data),

  getAchievements: (locale?: string) =>
    api.get<{ data: (Achievement & { unlocked?: boolean; unlockedAt?: string })[] }>('/gamification/achievements', {
      params: locale ? { locale } : undefined,
    }).then((r) => r.data),

  getChallenges: (date?: string) =>
    api.get<ListResponse<DailyChallenge>>('/gamification/challenges', {
      params: date ? { date } : undefined,
    }).then((r) => r.data),

  updateChallengeProgress: (challengeId: string, increment?: number) =>
    api.post<{ data: DailyChallenge }>('/gamification/challenges/progress', {
      challengeId,
      increment: increment ?? 1,
    }).then((r) => r.data),
}
