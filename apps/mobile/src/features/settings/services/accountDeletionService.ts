import { apiClient } from '@shared/api/client';
import { AUTH } from '@shared/api/endpoints';

export interface RequestDeletionPayload {
  confirmEmail: string;
  password?: string;
  reason?: string;
}

export const accountDeletionService = {
  request: async (payload: RequestDeletionPayload): Promise<{ ok: true; hasPassword: boolean }> => {
    const { data } = await apiClient.post<{ ok: true; hasPassword: boolean }>(
      AUTH.REQUEST_ACCOUNT_DELETION,
      payload
    );
    return data;
  },

  confirm: async (code: string): Promise<{ ok: true }> => {
    const { data } = await apiClient.post<{ ok: true }>(AUTH.CONFIRM_ACCOUNT_DELETION, { code });
    return data;
  },
};
