import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { settingsService } from '../services/settingsService';
import type { UserSettings, UserWorkPreferences, NotificationPreferences } from '@shared/types/models';

export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsService.getSettings(),
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => settingsService.updateSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
  });
}

export function useWorkPreferences() {
  return useQuery({
    queryKey: ['workPreferences'],
    queryFn: () => settingsService.getWorkPreferences(),
  });
}

export function useUpdateWorkPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserWorkPreferences>) => settingsService.updateWorkPreferences(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workPreferences'] }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => settingsService.getNotificationPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      settingsService.updateNotificationPreferences(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] }),
  });
}
