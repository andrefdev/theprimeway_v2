import type { LevelDefinition } from './types';

export const LEVELS: LevelDefinition[] = [
  { level: 1, name: 'Starter', minXp: 0 },
  { level: 2, name: 'Builder', minXp: 100 },
  { level: 3, name: 'Achiever', minXp: 300 },
  { level: 4, name: 'Champion', minXp: 600 },
  { level: 5, name: 'Prime', minXp: 1000 },
  { level: 6, name: 'Prime II', minXp: 1500 },
  { level: 7, name: 'Prime III', minXp: 2100 },
  { level: 8, name: 'Prime IV', minXp: 2800 },
  { level: 9, name: 'Prime V', minXp: 3600 },
  { level: 10, name: 'Legend', minXp: 4500 },
  // Extended levels (Solo Leveling progression)
  { level: 11, name: 'Legend II', minXp: 5500 },
  { level: 12, name: 'Legend III', minXp: 7000 },
  { level: 13, name: 'Mythic', minXp: 9000 },
  { level: 14, name: 'Mythic II', minXp: 11500 },
  { level: 15, name: 'Mythic III', minXp: 14500 },
  { level: 16, name: 'Transcendent', minXp: 18000 },
  { level: 17, name: 'Transcendent II', minXp: 22000 },
  { level: 18, name: 'Transcendent III', minXp: 27000 },
  { level: 19, name: 'Sovereign', minXp: 33000 },
  { level: 20, name: 'Monarch', minXp: 40000 },
];

export const XP_VALUES = {
  task: { low: 5, medium: 10, high: 15 },
  habit: 15,
  pomodoro: 20,
} as const;

export const DAILY_GOAL_DEFAULT = 50;

export const STREAK_MILESTONES = [7, 14, 30, 66, 100, 365] as const;

export function getLevelForXp(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXpToNextLevel(xp: number): { current: number; needed: number } {
  const currentLevel = getLevelForXp(xp);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  if (!nextLevel) return { current: 0, needed: 1 }; // Max level
  return {
    current: xp - currentLevel.minXp,
    needed: nextLevel.minXp - currentLevel.minXp,
  };
}
