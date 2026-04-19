export interface PrimeVision {
  id: string
  userId: string
  title: string
  description: string | null
  timeframe: string
  createdAt: string
  updatedAt: string
}

export interface ThreeYearGoal {
  id: string
  userId: string
  visionId: string
  name: string
  description: string | null
  area: string
  createdAt: string
  updatedAt: string
}

// Legacy alias for backwards compatibility
export type PrimePillar = ThreeYearGoal

export interface AnnualGoal {
  id: string
  userId: string
  threeYearGoalId: string
  title: string
  description: string | null
  targetDate: string | null
  progress: number
  createdAt: string
  updatedAt: string
}

// Legacy alias for backwards compatibility
export type PrimeOutcome = AnnualGoal

export interface KeyResult {
  title: string
  target: number
  current: number
  unit?: string
}

export interface QuarterlyGoal {
  id: string
  userId: string
  annualGoalId: string
  year: number
  quarter: number
  title: string
  description: string | null
  objectives: KeyResult[]
  progress: number
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

// Legacy alias for backwards compatibility
export type QuarterFocus = QuarterlyGoal

export type WeeklyGoalStatus = 'planned' | 'in_progress' | 'completed' | 'canceled'

export interface WeeklyGoal {
  id: string
  userId: string
  quarterlyGoalId: string | null
  weekStartDate: string
  title: string
  description: string | null
  status: WeeklyGoalStatus
  order: number
  createdAt: string
  updatedAt: string
}

export interface FocusLink {
  id: string
  quarterlyGoalId: string
  targetId: string
  targetType: 'task' | 'habit' | 'savings_goal' | 'budget'
  weight: number | null
  createdAt: string
}
