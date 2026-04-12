import { z } from 'zod/v4';

export const habitFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  targetFrequency: z.number().int().min(1).default(1),
  frequencyType: z
    .enum(['daily', 'week_days', 'times_per_week'])
    .default('daily'),
  weekDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export type HabitFormData = z.infer<typeof habitFormSchema>;

export interface HabitWithLogs {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color: string;
  targetFrequency: number;
  frequencyType?: string;
  weekDays?: number[];
  isActive: boolean;
  createdAt: string;
  logs?: {
    id: string;
    habitId: string;
    date: string;
    completedCount: number;
    notes?: string;
  }[];
}

export interface HabitStats {
  total_habits: number;
  total_completed_today: number;
  completion_rate: number;
  streaks: {
    longest: {
      habit_id: string;
      habit_name: string;
      streak_days: number;
    }[];
    current: {
      habit_id: string;
      habit_name: string;
      current_streak: number;
    }[];
  };
  daily_progress: {
    date: string;
    total_habits: number;
    completed_habits: number;
    completion_rate: number;
  }[];
  habit_details: {
    habit_id: string;
    habit_name: string;
    completion_rate: number;
    current_streak: number;
    longest_streak: number;
    total_completions: number;
  }[];
}

export interface HabitLogPayload {
  date: string;
  completed_count: number;
  notes?: string;
}

export interface CreateHabitPayload {
  name: string;
  description?: string;
  category?: string;
  color?: string;
  target_frequency: number;
  frequency_type: string;
  week_days?: number[];
  is_active?: boolean;
}

export interface UpdateHabitPayload extends Partial<CreateHabitPayload> {}
