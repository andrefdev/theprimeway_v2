import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  estimatedDuration: z.number().optional(),
  tags: z.array(z.string()).optional().default([]),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['open', 'completed', 'archived']).optional(),
  isArchived: z.boolean().optional(),
})

export type CreateTaskInput = z.input<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
