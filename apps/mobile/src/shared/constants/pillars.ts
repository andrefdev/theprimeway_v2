import type { PillarArea } from '@shared/types/models';

export interface PillarConfig {
  area: PillarArea;
  icon: string;
  color: string;
  labelEn: string;
  labelEs: string;
}

export const PILLARS: PillarConfig[] = [
  { area: 'finances', icon: 'Wallet', color: '#10b981', labelEn: 'Finances', labelEs: 'Finanzas' },
  { area: 'career', icon: 'Briefcase', color: '#3b82f6', labelEn: 'Career', labelEs: 'Carrera' },
  { area: 'health', icon: 'Heart', color: '#ef4444', labelEn: 'Health', labelEs: 'Salud' },
  {
    area: 'relationships',
    icon: 'Users',
    color: '#f59e0b',
    labelEn: 'Relationships',
    labelEs: 'Relaciones',
  },
  { area: 'mindset', icon: 'Brain', color: '#8b5cf6', labelEn: 'Mindset', labelEs: 'Mentalidad' },
  {
    area: 'lifestyle',
    icon: 'Sparkles',
    color: '#ec4899',
    labelEn: 'Lifestyle',
    labelEs: 'Lifestyle',
  },
];

export const PILLAR_MAP = Object.fromEntries(PILLARS.map((p) => [p.area, p])) as Record<
  PillarArea,
  PillarConfig
>;
