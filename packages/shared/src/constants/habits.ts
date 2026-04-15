/**
 * Life Pillars — the 6 core life areas that habits map to.
 * Replaces the previous 8-category system.
 */
export const LIFE_PILLARS = [
  { id: 'health_body', icon: 'heart', color: '#ef4444' },
  { id: 'mind_learning', icon: 'brain', color: '#8b5cf6' },
  { id: 'productivity', icon: 'target', color: '#3b82f6' },
  { id: 'relationships', icon: 'users', color: '#f59e0b' },
  { id: 'finance', icon: 'wallet', color: '#10b981' },
  { id: 'purpose', icon: 'sparkles', color: '#ec4899' },
] as const

export type LifePillarId = (typeof LIFE_PILLARS)[number]['id']

/**
 * Maps the old 8-category values to the new 6-pillar IDs.
 * Used for backwards-compatible migration of existing habits.
 */
export const CATEGORY_TO_PILLAR: Record<string, LifePillarId> = {
  health: 'health_body',
  fitness: 'health_body',
  mindfulness: 'mind_learning',
  learning: 'mind_learning',
  productivity: 'productivity',
  social: 'relationships',
  finance: 'finance',
  other: 'purpose',
}
