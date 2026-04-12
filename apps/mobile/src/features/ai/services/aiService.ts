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
};
