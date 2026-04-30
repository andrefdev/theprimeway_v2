import { apiClient } from '@shared/api/client';
import { BRAIN } from '@shared/api/endpoints';
import type { BrainEntry } from '@repo/shared/types';

export interface BrainListParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface BrainUserPatch {
  userTitle?: string;
  topics?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

export const brainService = {
  list: async (params: BrainListParams = {}): Promise<BrainEntry[]> => {
    const { data } = await apiClient.get<{ data: BrainEntry[] }>(BRAIN.ENTRIES, {
      params,
    });
    return data.data;
  },

  get: async (id: string): Promise<BrainEntry> => {
    const { data } = await apiClient.get<{ data: BrainEntry }>(BRAIN.BY_ID(id));
    return data.data;
  },

  create: async (content: string): Promise<BrainEntry> => {
    const { data } = await apiClient.post<{ data: BrainEntry }>(BRAIN.ENTRIES, {
      content,
    });
    return data.data;
  },

  update: async (id: string, patch: BrainUserPatch): Promise<BrainEntry> => {
    const { data } = await apiClient.put<{ data: BrainEntry }>(
      BRAIN.BY_ID(id),
      patch
    );
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(BRAIN.BY_ID(id));
  },

  reprocess: async (id: string): Promise<BrainEntry> => {
    const { data } = await apiClient.post<{ data: BrainEntry }>(
      BRAIN.REPROCESS(id)
    );
    return data.data;
  },

  applyActionItem: async (
    entryId: string,
    index: number
  ): Promise<{ task: { id: string; title: string } }> => {
    const { data } = await apiClient.post<{
      data: { task: { id: string; title: string } };
    }>(BRAIN.APPLY_ACTION_ITEM(entryId, index));
    return data.data;
  },
};
