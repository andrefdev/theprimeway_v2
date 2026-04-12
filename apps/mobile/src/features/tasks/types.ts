import { z } from 'zod/v4';

export type { Task, TaskStatus, TaskPriority, TaskSource } from '@shared/types/models';

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(1440).optional(),
  tags: z.array(z.string()).default([]),
  scheduledDate: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  isAllDay: z.boolean().default(false),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

// ============================================================
// API PARAMS
// ============================================================

export interface GetTasksParams {
  grouped?: boolean;
  date?: string;
  status?: 'open' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}

export interface TasksGroupedResponse {
  overdue: import('@shared/types/models').Task[];
  today: import('@shared/types/models').Task[];
  tomorrow: import('@shared/types/models').Task[];
  upcoming: import('@shared/types/models').Task[];
  unscheduled: import('@shared/types/models').Task[];
}
