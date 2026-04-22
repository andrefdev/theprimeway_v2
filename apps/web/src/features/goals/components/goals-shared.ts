import type { ThreeYearGoal, AnnualGoal, QuarterlyGoal } from '@repo/shared/types'

export const AREAS = ['finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle']

export type GoalLevel = 'three-year' | 'annual' | 'quarterly'
export type LevelFilter = GoalLevel | 'all'

export type UnifiedGoal =
  | { level: 'three-year'; data: ThreeYearGoal }
  | { level: 'annual'; data: AnnualGoal }
  | { level: 'quarterly'; data: QuarterlyGoal }

export const LEVEL_BADGE: Record<GoalLevel, 'default' | 'secondary' | 'outline'> = {
  'three-year': 'default',
  annual: 'secondary',
  quarterly: 'outline',
}

export function toArray<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[]
  return ((d as any)?.data ?? []) as T[]
}
