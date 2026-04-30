import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalizationApi } from './api'
import type { SectionCustomization, SectionId, UpsertSectionCustomizationRequest } from './model/types'
import { CACHE_TIMES } from '@repo/shared/constants'
import { patchQueries, rollbackQueries, snapshotQueries } from '@/shared/lib/optimistic'

interface CustomizationsResponse { data: SectionCustomization[] }

const CUSTOMIZATION_KEY = ['personalization', 'customizations'] as const

export const personalizationQueries = {
  all: () =>
    queryOptions({
      queryKey: CUSTOMIZATION_KEY,
      queryFn: () => personalizationApi.getAll(),
      staleTime: CACHE_TIMES.day,
    }),
}

export function useSectionCustomizations() {
  const query = useQuery(personalizationQueries.all())
  const list = query.data?.data ?? []
  const map = new Map<string, SectionCustomization>()
  for (const c of list) map.set(c.sectionId, c)
  return { ...query, customizationsMap: map, customizations: list }
}

export function useSectionCustomization(sectionId: SectionId) {
  const { customizationsMap } = useSectionCustomizations()
  return customizationsMap.get(sectionId) ?? null
}

export function useUpdateCustomization() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpsertSectionCustomizationRequest) => personalizationApi.upsert(data),
    onMutate: async (newData) => {
      const snaps = await snapshotQueries<CustomizationsResponse>(qc, CUSTOMIZATION_KEY)
      patchQueries<CustomizationsResponse>(qc, CUSTOMIZATION_KEY, (old) => {
        const existing = old.data.find((c) => c.sectionId === newData.sectionId)
        if (existing) {
          return {
            data: old.data.map((c) =>
              c.sectionId === newData.sectionId ? { ...c, ...newData } : c,
            ),
          }
        }
        return {
          data: [
            ...old.data,
            {
              id: `tmp-${newData.sectionId}`,
              userId: '',
              coverPositionY: 50,
              coverImageUrl: null,
              coverImageType: 'none' as const,
              iconType: 'default' as const,
              iconValue: null,
              ...newData,
            } as SectionCustomization,
          ],
        }
      })
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CUSTOMIZATION_KEY }),
  })
}
