export interface LevelDefinition {
  level: number;
  name: string;
  minXp: number;
}

export type CelebrationType = 'task' | 'habit' | 'pomodoro' | 'streak' | 'levelUp';

export interface XpEvent {
  type: CelebrationType;
  amount: number;
  label?: string;
}

export interface GamificationState {
  totalXp: number;
  level: number;
  levelName: string;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  dailyXp: number;
  dailyGoal: number;
  globalStreak: number;
}
