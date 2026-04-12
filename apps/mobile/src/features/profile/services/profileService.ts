import { apiClient } from '@shared/api/client';
import { USER } from '@shared/api/endpoints';
import type { UserProfile } from '@shared/types/models';

export const profileService = {
  getProfile: async () => {
    const { data } = await apiClient.get<UserProfile>(USER.PROFILE);
    return data;
  },

  updateProfile: async (profile: Partial<UserProfile>) => {
    const { data } = await apiClient.put<UserProfile>(USER.PROFILE, profile);
    return data;
  },
};
