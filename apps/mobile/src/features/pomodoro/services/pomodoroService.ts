import { apiClient } from '@shared/api/client';
import { POMODORO } from '@shared/api/endpoints';
import type { PomodoroSession } from '@shared/types/models';

export const pomodoroService = {
  getSessions: async () => {
    const { data } = await apiClient.get<PomodoroSession[]>(POMODORO.SESSIONS);
    return data;
  },

  createSession: async (session: Partial<PomodoroSession>) => {
    const { data } = await apiClient.post<PomodoroSession>(POMODORO.SESSIONS, session);
    return data;
  },

  updateSession: async (id: string, session: Partial<PomodoroSession>) => {
    const { data } = await apiClient.put<PomodoroSession>(POMODORO.SESSION_BY_ID(id), session);
    return data;
  },

  getStats: async () => {
    const { data } = await apiClient.get(POMODORO.STATS);
    return data;
  },
};
