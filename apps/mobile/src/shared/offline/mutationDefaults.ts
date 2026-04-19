import { queryClient } from '@/shared/providers/QueryProvider';
import { tasksService } from '@/features/tasks/services/tasksService';
import { habitsService } from '@/features/habits/services/habitsService';
import type { TaskFormData } from '@/features/tasks/types';
import type { HabitLogPayload } from '@/features/habits/types';

/**
 * Registers mutationFn defaults so TanStack Query can resume mutations
 * that were paused while offline — including across app restarts once
 * they've been rehydrated from AsyncStorage.
 *
 * Call once at app startup.
 */
export function registerMutationDefaults(): void {
  queryClient.setMutationDefaults(['tasks', 'create'], {
    mutationFn: (data: TaskFormData) => tasksService.createTask(data),
  });

  queryClient.setMutationDefaults(['tasks', 'update'], {
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> & { status?: string } }) =>
      tasksService.updateTask(id, data),
  });

  queryClient.setMutationDefaults(['tasks', 'delete'], {
    mutationFn: (id: string) => tasksService.deleteTask(id),
  });

  queryClient.setMutationDefaults(['habits', 'log'], {
    mutationFn: ({ id, data }: { id: string; data: HabitLogPayload }) =>
      habitsService.logHabit(id, data),
  });
}
