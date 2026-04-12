import { create } from 'zustand';
import { getLevelForXp, getXpToNextLevel, DAILY_GOAL_DEFAULT } from '../model/constants';
import type { CelebrationType, XpEvent } from '../model/types';
import {
  gamificationService,
  type GamificationProfileResponse,
} from '../services/gamificationService';

interface CelebrationPayload {
  type: CelebrationType;
  xp: number;
  message?: string;
}

interface GamificationStore {
  // State from backend
  totalXp: number;
  dailyXp: number;
  dailyGoal: number;
  level: number;
  levelName: string;
  rank: string;
  currentStreak: number;
  longestStreak: number;
  achievementsCount: number;
  rankScore: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  dailyGoalMet: boolean;
  title: string | null;

  // UI state
  pendingCelebration: CelebrationPayload | null;
  showCelebration: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;

  // Actions
  addXp: (event: XpEvent) => void;
  syncWithBackend: () => Promise<void>;
  awardXpToBackend: (params: {
    source: string;
    sourceId?: string;
    amount: number;
    earnedDate: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  hydrateFromProfile: (profile: GamificationProfileResponse) => void;
  triggerCelebration: (payload: CelebrationPayload) => void;
  dismissCelebration: () => void;
  setDailyGoal: (goal: number) => void;
}

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  totalXp: 0,
  dailyXp: 0,
  dailyGoal: DAILY_GOAL_DEFAULT,
  level: 1,
  levelName: 'Starter',
  rank: 'E',
  currentStreak: 0,
  longestStreak: 0,
  achievementsCount: 0,
  rankScore: 0,
  xpInCurrentLevel: 0,
  xpToNextLevel: 100,
  dailyGoalMet: false,
  title: null,
  pendingCelebration: null,
  showCelebration: false,
  isSyncing: false,
  lastSyncAt: null,

  // Optimistic local XP add (instant UI feedback)
  addXp: (event) => {
    const state = get();
    const prevLevel = getLevelForXp(state.totalXp);
    const newTotalXp = state.totalXp + event.amount;
    const newDailyXp = state.dailyXp + event.amount;
    const newLevel = getLevelForXp(newTotalXp);
    const xpProgress = getXpToNextLevel(newTotalXp);

    set({
      totalXp: newTotalXp,
      dailyXp: newDailyXp,
      level: newLevel.level,
      levelName: newLevel.name,
      xpInCurrentLevel: xpProgress.current,
      xpToNextLevel: xpProgress.needed,
      dailyGoalMet: newDailyXp >= state.dailyGoal,
    });

    // Check for level up
    if (newLevel.level > prevLevel.level) {
      set({
        pendingCelebration: {
          type: 'levelUp',
          xp: event.amount,
          message: `Level ${newLevel.level} - ${newLevel.name}`,
        },
        showCelebration: true,
      });
    }
  },

  // Fetch profile from backend and hydrate store
  syncWithBackend: async () => {
    const state = get();
    if (state.isSyncing) return;

    set({ isSyncing: true });
    try {
      const today = new Date().toISOString().split('T')[0];
      const profile = await gamificationService.getProfile(today);
      get().hydrateFromProfile(profile);
      set({ lastSyncAt: Date.now() });
    } catch (error) {
      console.error('[GamificationStore] Failed to sync with backend:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  // Award XP via backend (called after optimistic local update)
  awardXpToBackend: async (params) => {
    try {
      const result = await gamificationService.awardXp(params);

      // Reconcile with server truth
      get().hydrateFromProfile(result.profile);

      // Handle rank up (backend may have computed a new rank)
      if (result.rankUp && result.newRank) {
        set({
          pendingCelebration: {
            type: 'streak', // reuse streak celebration for rank-up visual
            xp: params.amount,
            message: `Rank Up! ${result.newRank}-Rank Hunter`,
          },
          showCelebration: true,
        });
      }

      // Handle achievement unlocks
      if (result.achievementsUnlocked?.length > 0) {
        const achievement = result.achievementsUnlocked[0];
        set({
          pendingCelebration: {
            type: 'habit', // reuse for achievement visual
            xp: achievement.xpReward,
            message: `Achievement: ${achievement.title}`,
          },
          showCelebration: true,
        });
      }
    } catch (error) {
      console.error('[GamificationStore] Failed to award XP to backend:', error);
      // Local optimistic state stays — will reconcile on next sync
    }
  },

  // Hydrate store from backend profile response
  hydrateFromProfile: (profile) => {
    set({
      totalXp: profile.totalXp,
      dailyXp: profile.dailyXp,
      dailyGoal: profile.dailyGoal,
      level: profile.level,
      levelName: profile.levelName,
      rank: profile.rank,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      achievementsCount: profile.achievementsCount,
      rankScore: profile.rankScore,
      xpInCurrentLevel: profile.xpInCurrentLevel,
      xpToNextLevel: profile.xpToNextLevel,
      dailyGoalMet: profile.dailyGoalMet,
      title: profile.title,
    });
  },

  triggerCelebration: (payload) => {
    set({ pendingCelebration: payload, showCelebration: true });
  },

  dismissCelebration: () => {
    set({ showCelebration: false, pendingCelebration: null });
  },

  setDailyGoal: (goal) => set({ dailyGoal: goal }),
}));
