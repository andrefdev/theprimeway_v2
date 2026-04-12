import type { SectionId, SectionCustomization } from '../model/types';
import { useSectionCustomizations } from './useSectionCustomizations';

export function useSectionCustomization(
  sectionId: SectionId
): SectionCustomization | null {
  const { customizationsMap } = useSectionCustomizations();
  return customizationsMap.get(sectionId) ?? null;
}
