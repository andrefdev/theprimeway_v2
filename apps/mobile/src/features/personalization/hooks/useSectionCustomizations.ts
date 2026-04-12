import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/authStore';
import { fetchSectionCustomizations } from '../services/personalizationApi';
import type { SectionCustomization, SectionId } from '../model/types';

export const SECTION_CUSTOMIZATIONS_KEY = 'section-customizations';

export function useSectionCustomizations() {
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [SECTION_CUSTOMIZATIONS_KEY],
    queryFn: fetchSectionCustomizations,
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const customizationsMap = useMemo(() => {
    const map = new Map<SectionId, SectionCustomization>();
    if (data) {
      for (const c of data) {
        map.set(c.sectionId, c);
      }
    }
    return map;
  }, [data]);

  return {
    customizations: data ?? [],
    customizationsMap,
    isLoading,
    error,
    refetch,
  };
}
