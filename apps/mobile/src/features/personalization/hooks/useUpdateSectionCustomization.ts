import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  upsertSectionCustomization,
  deleteSectionCustomization,
} from '../services/personalizationApi';
import type {
  SectionCustomization,
  UpsertSectionCustomizationRequest,
} from '../model/types';
import { SECTION_CUSTOMIZATIONS_KEY } from './useSectionCustomizations';

export function useUpdateSectionCustomization() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: (data: UpsertSectionCustomizationRequest) =>
      upsertSectionCustomization(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: [SECTION_CUSTOMIZATIONS_KEY],
      });

      const previous = queryClient.getQueryData<SectionCustomization[]>([
        SECTION_CUSTOMIZATIONS_KEY,
      ]);

      queryClient.setQueryData<SectionCustomization[]>(
        [SECTION_CUSTOMIZATIONS_KEY],
        (old = []) => {
          const idx = old.findIndex((c) => c.sectionId === newData.sectionId);
          const optimistic: SectionCustomization = {
            id: idx >= 0 ? old[idx].id : 'optimistic',
            userId: idx >= 0 ? old[idx].userId : '',
            sectionId: newData.sectionId,
            coverImageUrl:
              newData.coverImageUrl !== undefined
                ? newData.coverImageUrl
                : idx >= 0
                  ? old[idx].coverImageUrl
                  : null,
            coverImageType:
              newData.coverImageType ?? (idx >= 0 ? old[idx].coverImageType : 'none'),
            coverPositionY:
              newData.coverPositionY ?? (idx >= 0 ? old[idx].coverPositionY : 50),
            iconType:
              newData.iconType ?? (idx >= 0 ? old[idx].iconType : 'default'),
            iconValue:
              newData.iconValue !== undefined
                ? newData.iconValue
                : idx >= 0
                  ? old[idx].iconValue
                  : null,
            createdAt: idx >= 0 ? old[idx].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (idx >= 0) {
            const updated = [...old];
            updated[idx] = optimistic;
            return updated;
          }
          return [...old, optimistic];
        }
      );

      return { previous };
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [SECTION_CUSTOMIZATIONS_KEY],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [SECTION_CUSTOMIZATIONS_KEY],
      });
    },
  });

  const remove = useMutation({
    mutationFn: (sectionId: string) => deleteSectionCustomization(sectionId),
    onMutate: async (sectionId) => {
      await queryClient.cancelQueries({
        queryKey: [SECTION_CUSTOMIZATIONS_KEY],
      });

      const previous = queryClient.getQueryData<SectionCustomization[]>([
        SECTION_CUSTOMIZATIONS_KEY,
      ]);

      queryClient.setQueryData<SectionCustomization[]>(
        [SECTION_CUSTOMIZATIONS_KEY],
        (old = []) => old.filter((c) => c.sectionId !== sectionId)
      );

      return { previous };
    },
    onError: (_err, _sectionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [SECTION_CUSTOMIZATIONS_KEY],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [SECTION_CUSTOMIZATIONS_KEY],
      });
    },
  });

  return {
    upsert: upsert.mutate,
    upsertAsync: upsert.mutateAsync,
    deleteSection: remove.mutate,
    isUpdating: upsert.isPending,
    isDeleting: remove.isPending,
  };
}
