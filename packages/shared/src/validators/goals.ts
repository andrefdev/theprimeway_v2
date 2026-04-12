import { z } from 'zod'

export const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  type: z.string().default('short-term'),
  status: z.string().default('in-progress'),
  relatedTasks: z.array(z.string()).optional(),
})

export const updateGoalSchema = createGoalSchema.partial()

export const createVisionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.string().default('active'),
})

export const updateVisionSchema = createVisionSchema.partial()

export const createPillarSchema = z.object({
  visionId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  order: z.number().int().optional(),
})

export const updatePillarSchema = createPillarSchema.partial()

export const createOutcomeSchema = z.object({
  pillarId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.string().default('not-started'),
  progress: z.number().min(0).max(100).default(0),
})

export const updateOutcomeSchema = createOutcomeSchema.partial()

export const createQuarterFocusSchema = z.object({
  outcomeId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  quarter: z.string().min(1),
  year: z.number().int(),
  status: z.string().default('active'),
})

export const updateQuarterFocusSchema = createQuarterFocusSchema.partial()

export const createFocusLinkSchema = z.object({
  focusId: z.string().min(1),
  taskId: z.string().optional(),
  habitId: z.string().optional(),
  savingsGoalId: z.string().optional(),
  budgetId: z.string().optional(),
  type: z.string().min(1),
  targetAmount: z.number().optional(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type CreateVisionInput = z.infer<typeof createVisionSchema>
export type CreatePillarInput = z.infer<typeof createPillarSchema>
export type CreateOutcomeInput = z.infer<typeof createOutcomeSchema>
export type CreateQuarterFocusInput = z.infer<typeof createQuarterFocusSchema>
export type CreateFocusLinkInput = z.infer<typeof createFocusLinkSchema>
