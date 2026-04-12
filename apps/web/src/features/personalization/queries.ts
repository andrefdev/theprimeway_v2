import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalizationApi } from './api'
import type { SectionCustomization, SectionId, UpsertSectionCustomizationRequest } from './model/types'
import { CACHE_TIMES } from '@repo/shared/constants'

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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpsertSectionCustomizationRequest) => personalizationApi.upsert(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMIZATION_KEY })
      const previous = queryClient.getQueryData<{ data: SectionCustomization[] }>(CUSTOMIZATION_KEY)

      queryClient.setQueryData<{ data: SectionCustomization[] }>(CUSTOMIZATION_KEY, (old) => {
        if (!old) return old
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
            { id: 'temp', userId: '', ...newData, coverPositionY: 50, coverImageUrl: null, coverImageType: 'none' as const, iconType: 'default' as const, iconValue: null, ...newData } as SectionCustomization,
          ],
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CUSTOMIZATION_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMIZATION_KEY })
    },
  })
}
