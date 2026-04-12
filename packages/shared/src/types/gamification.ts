export interface GamificationProfile {
  id: string
  userId: string
  totalXp: number
  level: number
  rank: string
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  dailyGoal: number
  title: string | null
}

export interface XpEvent {
  id: string
  userId: string
  source: string
  sourceId: string | null
  amount: number
  earnedDate: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface DailyXpSnapshot {
  id: string
  userId: string
  date: string
  totalXp: number
}

export interface Achievement {
  id: string
  key: string
  titleEn: string
  titleEs: string
  descriptionEn: string
  descriptionEs: string
  icon: string
  category: string
  xpReward: number
  condition: Record<string, unknown>
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: string
  achievement?: Achievement
}

export interface DailyChallenge {
  id: string
  userId: string
  date: string
  type: string
  titleEn: string
  titleEs: string
  descriptionEn: string
  descriptionEs: string
  targetValue: number
  currentValue: number
  isCompleted: boolean
  xpReward: number
}
