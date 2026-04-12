import type { SectionId } from './types';
import type { LucideIcon } from 'lucide-react-native';
import {
  LayoutDashboard,
  ListChecks,
  CheckCheck,
  Target,
  CreditCard,
  StickyNote,
  BookOpen,
  CalendarDays,
  MessageSquare,
} from 'lucide-react-native';

// Default Lucide icons for each section (only 9 imports, not 84)
export const DEFAULT_SECTION_ICONS: Record<SectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  habits: CheckCheck,
  goals: Target,
  finances: CreditCard,
  notes: StickyNote,
  reading: BookOpen,
  calendar: CalendarDays,
  ai: MessageSquare,
};

// Emoji categories for the icon picker
export const EMOJI_CATEGORIES: Record<string, { name: string; emojis: string[] }> = {
  general: {
    name: 'General',
    emojis: ['📁', '📂', '📄', '📝', '📋', '📌', '⭐', '❤️', '💡', '🎯', '🏆', '🎖️'],
  },
  work: {
    name: 'Work',
    emojis: ['💼', '🏢', '👥', '👤', '📞', '📧', '🌐', '💻', '📱', '⚙️'],
  },
  creative: {
    name: 'Creative',
    emojis: ['🎨', '🎵', '📷', '🖼️', '🎬', '🎤', '🎧', '🎸', '🎮', '✏️'],
  },
  health: {
    name: 'Health',
    emojis: ['⚡', '🛡️', '☀️', '🌙', '☕', '🍎', '💪', '🏃‍♂️', '🧘‍♀️', '🏥'],
  },
  education: {
    name: 'Education',
    emojis: ['🎓', '📚', '✏️', '🧮', '🔬', '🧠', '📖', '📐', '🎒', '📝'],
  },
  finance: {
    name: 'Finance',
    emojis: ['💰', '💳', '🐷', '📈', '📊', '💸', '🏦', '💵', '💎', '🪙'],
  },
  travel: {
    name: 'Travel',
    emojis: ['📍', '✈️', '🚗', '🏠', '🏢', '🌳', '🗺️', '🚀', '🌍', '🏖️'],
  },
  nature: {
    name: 'Nature',
    emojis: ['🌿', '🌸', '☁️', '🌧️', '❄️', '🌺', '🌲', '🍃', '🌻', '🌈'],
  },
};

// Gallery cover images (Unsplash)
export type GalleryCategory =
  | 'nature'
  | 'abstract'
  | 'minimal'
  | 'gradient'
  | 'workspace'
  | 'motivational';

export interface GalleryImage {
  id: string;
  category: GalleryCategory;
  url: string;
  thumbnailUrl: string;
  credit: string;
  premium: boolean;
}

const unsplash = (photoId: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

export const COVER_GALLERY: GalleryImage[] = [
  // Nature
  { id: 'nature-1', category: 'nature', url: unsplash('1506744038136-46273834b3fb', 1600, 400), thumbnailUrl: unsplash('1506744038136-46273834b3fb', 400, 100), credit: 'Bailey Zindel', premium: false },
  { id: 'nature-2', category: 'nature', url: unsplash('1470071459604-3b5ec3a7fe05', 1600, 400), thumbnailUrl: unsplash('1470071459604-3b5ec3a7fe05', 400, 100), credit: 'v2osk', premium: true },
  { id: 'nature-3', category: 'nature', url: unsplash('1441974231531-c6227db76b6e', 1600, 400), thumbnailUrl: unsplash('1441974231531-c6227db76b6e', 400, 100), credit: 'Luca Bravo', premium: true },
  // Abstract
  { id: 'abstract-1', category: 'abstract', url: unsplash('1557672172-298e090bd0f1', 1600, 400), thumbnailUrl: unsplash('1557672172-298e090bd0f1', 400, 100), credit: 'Pawel Czerwinski', premium: false },
  { id: 'abstract-2', category: 'abstract', url: unsplash('1579546929518-9e396f3cc809', 1600, 400), thumbnailUrl: unsplash('1579546929518-9e396f3cc809', 400, 100), credit: 'Gradienta', premium: true },
  // Minimal
  { id: 'minimal-1', category: 'minimal', url: unsplash('1494438639946-1ebd1d20bf85', 1600, 400), thumbnailUrl: unsplash('1494438639946-1ebd1d20bf85', 400, 100), credit: 'Joel Filipe', premium: false },
  { id: 'minimal-2', category: 'minimal', url: unsplash('1517816743773-33a7e1c0faba', 1600, 400), thumbnailUrl: unsplash('1517816743773-33a7e1c0faba', 400, 100), credit: 'Patrick Tomasso', premium: true },
  // Gradient
  { id: 'gradient-1', category: 'gradient', url: unsplash('1614850523459-c2f4c699c52e', 1600, 400), thumbnailUrl: unsplash('1614850523459-c2f4c699c52e', 400, 100), credit: 'Codioful', premium: false },
  { id: 'gradient-2', category: 'gradient', url: unsplash('1614851099175-e5b30eb6f696', 1600, 400), thumbnailUrl: unsplash('1614851099175-e5b30eb6f696', 400, 100), credit: 'Codioful', premium: true },
  // Workspace
  { id: 'workspace-1', category: 'workspace', url: unsplash('1497366216548-37526070297c', 1600, 400), thumbnailUrl: unsplash('1497366216548-37526070297c', 400, 100), credit: 'Aleksi Tappura', premium: false },
  { id: 'workspace-2', category: 'workspace', url: unsplash('1498050108023-c5249f4df085', 1600, 400), thumbnailUrl: unsplash('1498050108023-c5249f4df085', 400, 100), credit: 'Christopher Gower', premium: true },
  // Motivational
  { id: 'motivational-1', category: 'motivational', url: unsplash('1519681393784-d120267933ba', 1600, 400), thumbnailUrl: unsplash('1519681393784-d120267933ba', 400, 100), credit: 'Benjamin Voros', premium: false },
  { id: 'motivational-2', category: 'motivational', url: unsplash('1454496522488-7a8e488e8606', 1600, 400), thumbnailUrl: unsplash('1454496522488-7a8e488e8606', 400, 100), credit: 'Joshua Earle', premium: true },
];

export const GALLERY_CATEGORIES: { id: GalleryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'motivational', label: 'Motivational' },
];
