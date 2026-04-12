import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { pomodoroService } from '../services/pomodoroService';
import type { PomodoroSession } from '@shared/types/models';

export function usePomodoroSessions() {
  return useQuery({
    queryKey: queryKeys.pomodoro.sessions,
    queryFn: () => pomodoroService.getSessions(),
  });
}

export function usePomodoroStats() {
  return useQuery({
    queryKey: queryKeys.pomodoro.stats,
    queryFn: () => pomodoroService.getStats(),
  });
}

export function useCreatePomodoroSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PomodoroSession>) => pomodoroService.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.stats });
    },
  });
}

export function useUpdatePomodoroSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PomodoroSession> }) =>
      pomodoroService.updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.stats });
    },
  });
}
