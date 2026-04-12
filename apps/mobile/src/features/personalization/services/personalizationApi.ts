import { apiClient } from '@/shared/api/client';
import type { SectionCustomization, UpsertSectionCustomizationRequest } from '../model/types';

export async function fetchSectionCustomizations(): Promise<SectionCustomization[]> {
  const response = await apiClient.get<{ data: SectionCustomization[] }>(
    '/api/user/section-customizations'
  );
  return response.data.data;
}

export async function upsertSectionCustomization(
  data: UpsertSectionCustomizationRequest
): Promise<SectionCustomization> {
  const response = await apiClient.put<{ data: SectionCustomization }>(
    '/api/user/section-customizations',
    data
  );
  return response.data.data;
}

export async function deleteSectionCustomization(sectionId: string): Promise<void> {
  await apiClient.delete(`/api/user/section-customizations?section_id=${sectionId}`);
}
