import { apiClient } from '@shared/api/client';
import { AI } from '@shared/api/endpoints';
import type { AiThread } from '@shared/types/models';

export const aiService = {
  getThreads: async () => {
    const { data } = await apiClient.get<AiThread[]>(AI.THREADS);
    return data;
  },

  sendMessage: async (message: string, threadId?: string) => {
    // Returns a readable stream for SSE
    const response = await apiClient.post(
      AI.CHAT,
      { message, threadId },
      { responseType: 'text' }
    );
    return response.data;
  },

  generateWeeklyPlan: async (weekStartDate: string): Promise<WeeklyPlanResponse> => {
    const { data } = await apiClient.post(AI.WEEKLY_PLAN, { weekStartDate });
    return data.data;
  },
};

export type WeeklyPlanDay = { title: string; timeBlock?: string };
export interface WeeklyPlanResponse {
  plan: {
    Monday: WeeklyPlanDay[];
    Tuesday: WeeklyPlanDay[];
    Wednesday: WeeklyPlanDay[];
    Thursday: WeeklyPlanDay[];
    Friday: WeeklyPlanDay[];
    Saturday: WeeklyPlanDay[];
    Sunday: WeeklyPlanDay[];
  };
  rationale: string;
}
