import { apiClient } from '@shared/api/client';
import { USER, NOTIFICATIONS } from '@shared/api/endpoints';
import type {
  UserSettings,
  UserWorkPreferences,
  NotificationPreferences,
} from '@shared/types/models';

export const settingsService = {
  getSettings: async () => {
    const { data } = await apiClient.get<UserSettings>(USER.SETTINGS);
    return data;
  },

  updateSettings: async (settings: Partial<UserSettings>) => {
    const { data } = await apiClient.put<UserSettings>(USER.SETTINGS, settings);
    return data;
  },

  getWorkPreferences: async () => {
    const { data } = await apiClient.get<UserWorkPreferences>(USER.WORK_PREFERENCES);
    return data;
  },

  updateWorkPreferences: async (prefs: Partial<UserWorkPreferences>) => {
    const { data } = await apiClient.put<UserWorkPreferences>(USER.WORK_PREFERENCES, prefs);
    return data;
  },

  getNotificationPreferences: async () => {
    const { data } = await apiClient.get<NotificationPreferences>(NOTIFICATIONS.PREFERENCES);
    return data;
  },

  updateNotificationPreferences: async (prefs: Partial<NotificationPreferences>) => {
    const { data } = await apiClient.put<NotificationPreferences>(
      NOTIFICATIONS.PREFERENCES,
      prefs
    );
    return data;
  },

  deleteAccount: async () => {
    await apiClient.delete(USER.DELETE);
  },
};
