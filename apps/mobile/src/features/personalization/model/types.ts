export const SECTION_IDS = [
  'dashboard',
  'tasks',
  'habits',
  'goals',
  'finances',
  'notes',
  'reading',
  'calendar',
  'ai',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type CoverImageType = 'none' | 'gallery' | 'custom';
export type IconType = 'default' | 'emoji' | 'lucide';

export interface SectionCustomization {
  id: string;
  userId: string;
  sectionId: SectionId;
  coverImageUrl: string | null;
  coverImageType: CoverImageType;
  coverPositionY: number;
  iconType: IconType;
  iconValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSectionCustomizationRequest {
  sectionId: SectionId;
  coverImageUrl?: string | null;
  coverImageType?: CoverImageType;
  coverPositionY?: number;
  iconType?: IconType;
  iconValue?: string | null;
}
