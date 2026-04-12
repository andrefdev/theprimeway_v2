import { api } from '../../lib/api-client'
import type { SectionCustomization, UpsertSectionCustomizationRequest } from './model/types'

export const personalizationApi = {
  getAll: () =>
    api.get<{ data: SectionCustomization[] }>('/user/section-customizations').then((r) => r.data),

  upsert: (data: UpsertSectionCustomizationRequest) =>
    api.put<{ data: SectionCustomization }>('/user/section-customizations', data).then((r) => r.data),

  deleteSection: (sectionId: string) =>
    api.delete(`/user/section-customizations?sectionId=${sectionId}`).then((r) => r.data),
}
