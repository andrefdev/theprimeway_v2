import { z } from 'zod'

export const addBookSchema = z.object({
  workKey: z.string().min(1),
  editionKey: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  authors: z.array(z.string()).optional(),
  coverUrl: z.string().optional(),
  pages: z.number().int().optional(),
  publishYear: z.number().int().optional(),
  language: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  isbnList: z.array(z.string()).optional(),
  openLibraryUrl: z.string().optional(),
  status: z.string().default('to_read'),
  priority: z.string().default('medium'),
  plannedQuarter: z.string().optional(),
})

export const updateBookSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  plannedQuarter: z.string().nullable().optional(),
  plannedStartDate: z.string().nullable().optional(),
  targetFinishDate: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  currentPage: z.number().int().min(0).optional(),
  totalPagesSnapshot: z.number().int().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
})

export const createReadingGoalSchema = z.object({
  periodType: z.string().min(1),
  targetBooks: z.number().int().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const updateReadingGoalSchema = z.object({
  targetBooks: z.number().int().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type AddBookInput = z.infer<typeof addBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
export type CreateReadingGoalInput = z.infer<typeof createReadingGoalSchema>
export type UpdateReadingGoalInput = z.infer<typeof updateReadingGoalSchema>
