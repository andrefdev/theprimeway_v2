import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { brainService, type BrainListParams, type BrainUserPatch } from '../services/brainService';
import type { BrainEntry } from '@repo/shared/types';

const ACTIVE_STATUSES = new Set(['pending', 'transcribing', 'analyzing']);

function tempBrainId() {
  return `brain-tmp-${Math.random().toString(36).slice(2, 10)}`;
}

export function useBrainFeed(params: BrainListParams = {}) {
  return useQuery({
    queryKey: queryKeys.brain.feed(params),
    queryFn: () => brainService.list(params),
    staleTime: 10_000,
    refetchInterval: (q) => {
      const data = q.state.data as BrainEntry[] | undefined;
      return data?.some((e) => ACTIVE_STATUSES.has(e.status)) ? 3000 : false;
    },
  });
}

export function useBrainEntry(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.brain.entry(id) : ['brain', 'entry', 'none'],
    queryFn: () => brainService.get(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data as BrainEntry | undefined;
      return data && ACTIVE_STATUSES.has(data.status) ? 2000 : false;
    },
  });
}

export function useCreateBrainEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => brainService.create(content),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: queryKeys.brain.feeds() });
      const snapshots = qc.getQueriesData<BrainEntry[]>({
        queryKey: queryKeys.brain.feeds(),
      });
      const now = new Date().toISOString();
      const optimistic: BrainEntry = {
        id: tempBrainId(),
        userId: '',
        sourceType: 'mobile',
        sourceDevice: null,
        rawTranscript: content,
        language: null,
        title: null,
        summary: null,
        structuredContent: null,
        topics: [],
        sentiment: null,
        actionItems: [],
        aiMetadata: null,
        status: 'pending',
        errorMessage: null,
        processedAt: null,
        userTitle: null,
        isPinned: false,
        isArchived: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      snapshots.forEach(([key, data]) => {
        qc.setQueryData<BrainEntry[]>(key, [optimistic, ...(data ?? [])]);
      });
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.brain.feeds() }),
  });
}

export function useUpdateBrainEntry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: BrainUserPatch) => brainService.update(id, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.brain.feeds() });
      await qc.cancelQueries({ queryKey: queryKeys.brain.entry(id) });
      const feedSnaps = qc.getQueriesData<BrainEntry[]>({
        queryKey: queryKeys.brain.feeds(),
      });
      const entrySnap = qc.getQueryData<BrainEntry>(queryKeys.brain.entry(id));
      feedSnaps.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<BrainEntry[]>(
          key,
          data.map((e) => (e.id === id ? { ...e, ...patch } : e))
        );
      });
      if (entrySnap) {
        qc.setQueryData<BrainEntry>(queryKeys.brain.entry(id), {
          ...entrySnap,
          ...patch,
        });
      }
      return { feedSnaps, entrySnap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.feedSnaps?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.entrySnap) qc.setQueryData(queryKeys.brain.entry(id), ctx.entrySnap);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.brain.entry(id) });
      qc.invalidateQueries({ queryKey: queryKeys.brain.feeds() });
    },
  });
}

export function useDeleteBrainEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainService.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.brain.feeds() });
      const snapshots = qc.getQueriesData<BrainEntry[]>({
        queryKey: queryKeys.brain.feeds(),
      });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<BrainEntry[]>(key, data.filter((e) => e.id !== id));
      });
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.brain.feeds() }),
  });
}

export function useReprocessBrainEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brainService.reprocess(id),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: queryKeys.brain.feeds() });
      qc.invalidateQueries({ queryKey: queryKeys.brain.entry(entry.id) });
    },
  });
}

export function useApplyActionItem(entryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (index: number) => brainService.applyActionItem(entryId, index),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.brain.entry(entryId) });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
