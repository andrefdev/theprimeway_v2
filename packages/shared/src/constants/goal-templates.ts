/**
 * Pre-built goal templates by category.
 * Used to help users quickly set up goals with suggested sub-goals.
 *
 * OBJ-F09
 */

export const GOAL_TEMPLATE_CATEGORIES = [
  'fitness',
  'career',
  'finance',
  'learning',
  'relationships',
  'wellness',
] as const

export type GoalTemplateCategory = (typeof GOAL_TEMPLATE_CATEGORIES)[number]

export interface GoalTemplate {
  id: string
  category: GoalTemplateCategory
  titleKey: string
  descriptionKey: string
  level: 'threeYear' | 'annual' | 'quarterly'
  suggestedChildren: Array<{ titleKey: string; level: string }>
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // ─── Fitness ────────────────────────────────────────────────────────────────
  {
    id: 'fitness-marathon',
    category: 'fitness',
    titleKey: 'goalTemplates.fitness.marathon.title',
    descriptionKey: 'goalTemplates.fitness.marathon.description',
    level: 'threeYear',
    suggestedChildren: [
      { titleKey: 'goalTemplates.fitness.marathon.child1', level: 'annual' },
      { titleKey: 'goalTemplates.fitness.marathon.child2', level: 'annual' },
      { titleKey: 'goalTemplates.fitness.marathon.child3', level: 'quarterly' },
    ],
  },
  {
    id: 'fitness-workout-habit',
    category: 'fitness',
    titleKey: 'goalTemplates.fitness.workoutHabit.title',
    descriptionKey: 'goalTemplates.fitness.workoutHabit.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.fitness.workoutHabit.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.fitness.workoutHabit.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'fitness-target-weight',
    category: 'fitness',
    titleKey: 'goalTemplates.fitness.targetWeight.title',
    descriptionKey: 'goalTemplates.fitness.targetWeight.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.fitness.targetWeight.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.fitness.targetWeight.child2', level: 'quarterly' },
      { titleKey: 'goalTemplates.fitness.targetWeight.child3', level: 'quarterly' },
    ],
  },

  // ─── Career ─────────────────────────────────────────────────────────────────
  {
    id: 'career-promotion',
    category: 'career',
    titleKey: 'goalTemplates.career.promotion.title',
    descriptionKey: 'goalTemplates.career.promotion.description',
    level: 'threeYear',
    suggestedChildren: [
      { titleKey: 'goalTemplates.career.promotion.child1', level: 'annual' },
      { titleKey: 'goalTemplates.career.promotion.child2', level: 'annual' },
      { titleKey: 'goalTemplates.career.promotion.child3', level: 'quarterly' },
    ],
  },
  {
    id: 'career-new-stack',
    category: 'career',
    titleKey: 'goalTemplates.career.newStack.title',
    descriptionKey: 'goalTemplates.career.newStack.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.career.newStack.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.career.newStack.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'career-side-project',
    category: 'career',
    titleKey: 'goalTemplates.career.sideProject.title',
    descriptionKey: 'goalTemplates.career.sideProject.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.career.sideProject.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.career.sideProject.child2', level: 'quarterly' },
      { titleKey: 'goalTemplates.career.sideProject.child3', level: 'quarterly' },
    ],
  },

  // ─── Finance ────────────────────────────────────────────────────────────────
  {
    id: 'finance-emergency-fund',
    category: 'finance',
    titleKey: 'goalTemplates.finance.emergencyFund.title',
    descriptionKey: 'goalTemplates.finance.emergencyFund.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.finance.emergencyFund.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.finance.emergencyFund.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'finance-pay-debt',
    category: 'finance',
    titleKey: 'goalTemplates.finance.payDebt.title',
    descriptionKey: 'goalTemplates.finance.payDebt.description',
    level: 'threeYear',
    suggestedChildren: [
      { titleKey: 'goalTemplates.finance.payDebt.child1', level: 'annual' },
      { titleKey: 'goalTemplates.finance.payDebt.child2', level: 'annual' },
      { titleKey: 'goalTemplates.finance.payDebt.child3', level: 'quarterly' },
    ],
  },
  {
    id: 'finance-start-investing',
    category: 'finance',
    titleKey: 'goalTemplates.finance.startInvesting.title',
    descriptionKey: 'goalTemplates.finance.startInvesting.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.finance.startInvesting.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.finance.startInvesting.child2', level: 'quarterly' },
    ],
  },

  // ─── Learning ───────────────────────────────────────────────────────────────
  {
    id: 'learning-read-books',
    category: 'learning',
    titleKey: 'goalTemplates.learning.readBooks.title',
    descriptionKey: 'goalTemplates.learning.readBooks.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.learning.readBooks.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.learning.readBooks.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'learning-certification',
    category: 'learning',
    titleKey: 'goalTemplates.learning.certification.title',
    descriptionKey: 'goalTemplates.learning.certification.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.learning.certification.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.learning.certification.child2', level: 'quarterly' },
      { titleKey: 'goalTemplates.learning.certification.child3', level: 'quarterly' },
    ],
  },
  {
    id: 'learning-new-language',
    category: 'learning',
    titleKey: 'goalTemplates.learning.newLanguage.title',
    descriptionKey: 'goalTemplates.learning.newLanguage.description',
    level: 'threeYear',
    suggestedChildren: [
      { titleKey: 'goalTemplates.learning.newLanguage.child1', level: 'annual' },
      { titleKey: 'goalTemplates.learning.newLanguage.child2', level: 'annual' },
      { titleKey: 'goalTemplates.learning.newLanguage.child3', level: 'quarterly' },
    ],
  },

  // ─── Relationships ──────────────────────────────────────────────────────────
  {
    id: 'relationships-date-night',
    category: 'relationships',
    titleKey: 'goalTemplates.relationships.dateNight.title',
    descriptionKey: 'goalTemplates.relationships.dateNight.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.relationships.dateNight.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.relationships.dateNight.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'relationships-family-activity',
    category: 'relationships',
    titleKey: 'goalTemplates.relationships.familyActivity.title',
    descriptionKey: 'goalTemplates.relationships.familyActivity.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.relationships.familyActivity.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.relationships.familyActivity.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'relationships-reconnect-friends',
    category: 'relationships',
    titleKey: 'goalTemplates.relationships.reconnectFriends.title',
    descriptionKey: 'goalTemplates.relationships.reconnectFriends.description',
    level: 'quarterly',
    suggestedChildren: [
      { titleKey: 'goalTemplates.relationships.reconnectFriends.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.relationships.reconnectFriends.child2', level: 'quarterly' },
    ],
  },

  // ─── Wellness ───────────────────────────────────────────────────────────────
  {
    id: 'wellness-meditation',
    category: 'wellness',
    titleKey: 'goalTemplates.wellness.meditation.title',
    descriptionKey: 'goalTemplates.wellness.meditation.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.wellness.meditation.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.wellness.meditation.child2', level: 'quarterly' },
    ],
  },
  {
    id: 'wellness-sleep',
    category: 'wellness',
    titleKey: 'goalTemplates.wellness.sleep.title',
    descriptionKey: 'goalTemplates.wellness.sleep.description',
    level: 'annual',
    suggestedChildren: [
      { titleKey: 'goalTemplates.wellness.sleep.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.wellness.sleep.child2', level: 'quarterly' },
      { titleKey: 'goalTemplates.wellness.sleep.child3', level: 'quarterly' },
    ],
  },
  {
    id: 'wellness-screen-time',
    category: 'wellness',
    titleKey: 'goalTemplates.wellness.screenTime.title',
    descriptionKey: 'goalTemplates.wellness.screenTime.description',
    level: 'quarterly',
    suggestedChildren: [
      { titleKey: 'goalTemplates.wellness.screenTime.child1', level: 'quarterly' },
      { titleKey: 'goalTemplates.wellness.screenTime.child2', level: 'quarterly' },
    ],
  },
]
