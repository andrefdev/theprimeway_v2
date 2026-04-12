import { apiClient } from '@shared/api/client';
import { GAMIFICATION } from '@shared/api/endpoints';

export interface GamificationProfileResponse {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  levelName: string;
  rank: string;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  achievementsCount: number;
  title: string | null;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  rankScore: number;
  dailyXp: number;
  dailyGoalMet: boolean;
}

export interface AwardXpResponse {
  xpEvent: {
    id: string;
    amount: number;
    source: string;
  };
  profile: GamificationProfileResponse;
  levelUp: boolean;
  rankUp: boolean;
  newLevel: number | null;
  newRank: string | null;
  achievementsUnlocked: Array<{
    id: string;
    key: string;
    title: string;
    xpReward: number;
    rarity: string;
  }>;
}

class GamificationService {
  async getProfile(date?: string): Promise<GamificationProfileResponse> {
    const response = await apiClient.get(GAMIFICATION.PROFILE, {
      params: date ? { date } : undefined,
    });
    return response.data.data;
  }

  async awardXp(params: {
    source: string;
    sourceId?: string;
    amount: number;
    earnedDate: string;
    metadata?: Record<string, unknown>;
  }): Promise<AwardXpResponse> {
    const response = await apiClient.post(GAMIFICATION.XP, params);
    return response.data.data;
  }

  async getStreak(): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    heatmap: Array<{ date: string; totalXp: number; goalMet: boolean }>;
  }> {
    const response = await apiClient.get(GAMIFICATION.STREAK);
    return response.data.data;
  }

  async getAchievements(locale?: string): Promise<{
    data: Array<{
      id: string;
      key: string;
      title: string;
      description: string;
      iconName: string;
      xpReward: number;
      rarity: string;
      unlocked: boolean;
      unlockedAt: string | null;
    }>;
    count: number;
  }> {
    const response = await apiClient.get(GAMIFICATION.ACHIEVEMENTS, {
      params: locale ? { locale } : undefined,
    });
    return response.data;
  }

  async getChallenges(date?: string, locale?: string): Promise<{
    data: Array<{
      id: string;
      date: string;
      type: string;
      title: string;
      description: string;
      xpReward: number;
      targetValue: number;
      currentValue: number;
      isCompleted: boolean;
    }>;
    count: number;
  }> {
    const response = await apiClient.get(GAMIFICATION.CHALLENGES, {
      params: { date, locale },
    });
    return response.data;
  }
}

export const gamificationService = new GamificationService();
