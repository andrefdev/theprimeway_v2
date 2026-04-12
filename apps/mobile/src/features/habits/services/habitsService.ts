import { apiClient } from '@shared/api/client';
import { HABITS } from '@shared/api/endpoints';
import type { Habit, HabitLog } from '@shared/types/models';
import type {
  HabitWithLogs,
  HabitStats,
  CreateHabitPayload,
  UpdateHabitPayload,
  HabitLogPayload,
} from '../types';

// API wraps responses: { data: T }
function unwrap<T>(response: any): T {
  return response.data ?? response;
}

export const habitsService = {
  getHabits: async (params?: {
    include_logs?: boolean;
    applicable_date?: string;
  }): Promise<HabitWithLogs[]> => {
    const { data: response } = await apiClient.get(HABITS.BASE, {
      params: {
        include_logs: params?.include_logs ?? true,
        applicable_date:
          params?.applicable_date ?? new Date().toISOString().split('T')[0],
      },
    });
    // API returns { data: [...], count: N } or just array
    const result = Array.isArray(response) ? response : (response?.data ?? []);
    return Array.isArray(result) ? result : [];
  },

  createHabit: async (payload: CreateHabitPayload): Promise<Habit> => {
    const { data: response } = await apiClient.post(HABITS.BASE, payload);
    return unwrap<Habit>(response);
  },

  updateHabit: async (id: string, payload: UpdateHabitPayload): Promise<Habit> => {
    const { data: response } = await apiClient.patch(HABITS.BY_ID(id), payload);
    return unwrap<Habit>(response);
  },

  deleteHabit: async (id: string): Promise<void> => {
    await apiClient.delete(HABITS.BY_ID(id));
  },

  logHabit: async (id: string, payload: HabitLogPayload): Promise<HabitLog> => {
    const { data: response } = await apiClient.post(HABITS.LOGS(id), payload);
    return unwrap<HabitLog>(response);
  },

  getStats: async (period?: 'week' | 'month' | 'quarter' | 'year'): Promise<HabitStats> => {
    const { data: response } = await apiClient.get(HABITS.STATS, {
      params: { period: period ?? 'month' },
    });
    return unwrap<HabitStats>(response);
  },
};
