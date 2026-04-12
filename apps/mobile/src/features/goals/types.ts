import { z } from 'zod/v4';

// ============================================================
// Zod Schemas
// ============================================================

export const visionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  narrative: z.string().max(2000, 'Narrative too long').optional(),
});

export const pillarSchema = z.object({
  visionId: z.string().min(1, 'Vision is required'),
  area: z.enum(['finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle']),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const outcomeSchema = z.object({
  pillarId: z.string().min(1, 'Pillar is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const focusSchema = z.object({
  outcomeId: z.string().min(1, 'Outcome is required'),
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  objectives: z.record(z.string(), z.unknown()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const weeklyGoalSchema = z.object({
  quarterFocusId: z.string().min(1, 'Quarter focus is required'),
  weekStartDate: z.string().min(1, 'Week start date is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'canceled']).optional(),
  order: z.number().int().min(0).optional(),
});

// ============================================================
// Form Data Types
// ============================================================

export type VisionFormData = z.infer<typeof visionSchema>;
export type PillarFormData = z.infer<typeof pillarSchema>;
export type OutcomeFormData = z.infer<typeof outcomeSchema>;
export type FocusFormData = z.infer<typeof focusSchema>;
export type WeeklyGoalFormData = z.infer<typeof weeklyGoalSchema>;
