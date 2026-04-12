import type { SectionId } from './types'

export const DEFAULT_SECTION_EMOJIS: Record<SectionId, string> = {
  dashboard: '\uD83C\uDFE0',
  tasks: '\u2705',
  habits: '\uD83D\uDD01',
  goals: '\uD83C\uDFAF',
  finances: '\uD83D\uDCB0',
  notes: '\uD83D\uDCDD',
  reading: '\uD83D\uDCDA',
  calendar: '\uD83D\uDCC5',
  ai: '\uD83E\uDD16',
}

export const DEFAULT_SECTION_ICONS: Record<SectionId, string> = {
  dashboard: 'ci:house-02',
  tasks: 'ci:list-check',
  habits: 'ci:check-all',
  goals: 'ci:radio-fill',
  finances: 'ci:credit-card-01',
  notes: 'ci:note',
  reading: 'ci:book-open',
  calendar: 'ci:calendar',
  ai: 'ci:chat',
}

export const COOLICON_CATEGORIES: Record<
  string,
  { name: string; icons: { name: string; id: string }[] }
> = {
  general: {
    name: 'General',
    icons: [
      { name: 'Home', id: 'ci:house-02' },
      { name: 'Star', id: 'ci:star' },
      { name: 'Heart', id: 'ci:heart-fill' },
      { name: 'Bookmark', id: 'ci:bookmark' },
      { name: 'Flag', id: 'ci:flag' },
      { name: 'Bell', id: 'ci:bell' },
      { name: 'Clock', id: 'ci:clock' },
      { name: 'Calendar', id: 'ci:calendar' },
      { name: 'Search', id: 'ci:search' },
      { name: 'Settings', id: 'ci:settings' },
      { name: 'Filter', id: 'ci:filter' },
      { name: 'Grid', id: 'ci:grid-big' },
    ],
  },
  productivity: {
    name: 'Productivity',
    icons: [
      { name: 'List Check', id: 'ci:list-check' },
      { name: 'Check All', id: 'ci:check-all' },
      { name: 'Note', id: 'ci:note' },
      { name: 'Edit', id: 'ci:edit-pencil-01' },
      { name: 'Layers', id: 'ci:layers' },
      { name: 'Target', id: 'ci:radio-fill' },
      { name: 'Stopwatch', id: 'ci:stopwatch' },
      { name: 'Timer', id: 'ci:timer' },
      { name: 'Repeat', id: 'ci:repeat' },
      { name: 'Sort', id: 'ci:sort-ascending' },
    ],
  },
  communication: {
    name: 'Communication',
    icons: [
      { name: 'Chat', id: 'ci:chat' },
      { name: 'Mail', id: 'ci:mail' },
      { name: 'Send', id: 'ci:send' },
      { name: 'Message', id: 'ci:message-square' },
      { name: 'Phone', id: 'ci:phone' },
      { name: 'Video', id: 'ci:video' },
      { name: 'Mic', id: 'ci:microphone' },
      { name: 'User', id: 'ci:user' },
      { name: 'Users', id: 'ci:users' },
      { name: 'Globe', id: 'ci:globe' },
    ],
  },
  finance: {
    name: 'Finance',
    icons: [
      { name: 'Credit Card', id: 'ci:credit-card-01' },
      { name: 'Dollar', id: 'ci:dollar' },
      { name: 'Chart Bar', id: 'ci:chart-bar-vertical-01' },
      { name: 'Transfer', id: 'ci:transfer' },
      { name: 'Trending Up', id: 'ci:trending-up' },
      { name: 'Trending Down', id: 'ci:trending-down' },
      { name: 'Wallet', id: 'ci:wallet' },
      { name: 'Receipt', id: 'ci:file-document' },
    ],
  },
  media: {
    name: 'Media & Creative',
    icons: [
      { name: 'Image', id: 'ci:image-02' },
      { name: 'Camera', id: 'ci:camera' },
      { name: 'Music', id: 'ci:music-note-02' },
      { name: 'Play', id: 'ci:play' },
      { name: 'Headphones', id: 'ci:headphones' },
      { name: 'Book Open', id: 'ci:book-open' },
      { name: 'Palette', id: 'ci:palette' },
      { name: 'Pen', id: 'ci:pen' },
    ],
  },
  health: {
    name: 'Health & Wellness',
    icons: [
      { name: 'Heart', id: 'ci:heart-fill' },
      { name: 'Activity', id: 'ci:activity' },
      { name: 'Sun', id: 'ci:sun' },
      { name: 'Moon', id: 'ci:moon' },
      { name: 'Coffee', id: 'ci:coffee' },
      { name: 'Leaf', id: 'ci:leaf' },
      { name: 'Flame', id: 'ci:flame' },
      { name: 'Zap', id: 'ci:lightning' },
    ],
  },
  tech: {
    name: 'Tech & Tools',
    icons: [
      { name: 'Code', id: 'ci:code' },
      { name: 'Terminal', id: 'ci:terminal' },
      { name: 'Database', id: 'ci:database' },
      { name: 'Cloud', id: 'ci:cloud' },
      { name: 'Link', id: 'ci:link' },
      { name: 'Lock', id: 'ci:lock' },
      { name: 'Key', id: 'ci:key' },
      { name: 'Wifi', id: 'ci:wifi' },
    ],
  },
  navigation: {
    name: 'Navigation & Travel',
    icons: [
      { name: 'Map Pin', id: 'ci:location' },
      { name: 'Compass', id: 'ci:compass' },
      { name: 'Navigation', id: 'ci:navigation' },
      { name: 'Rocket', id: 'ci:rocket' },
      { name: 'Plane', id: 'ci:plane' },
      { name: 'Car', id: 'ci:car' },
    ],
  },
}

export type GalleryCategory =
  | 'nature'
  | 'abstract'
  | 'minimal'
  | 'gradient'
  | 'workspace'
  | 'motivational'
  | 'motivation'

export interface GalleryImage {
  id: string
  category: GalleryCategory
  url: string
  thumbnailUrl: string
  credit: string
  premium: boolean
}

const unsplash = (
  photoId: string,
  w: number,
  h: number,
) =>
  `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=80`

export const COVER_GALLERY: GalleryImage[] = [
  // Nature
  { id: 'nature-1', category: 'nature', url: unsplash('1506744038136-46273834b3fb', 1600, 400), thumbnailUrl: unsplash('1506744038136-46273834b3fb', 400, 100), credit: 'Bailey Zindel', premium: false },
  { id: 'nature-2', category: 'nature', url: unsplash('1470071459604-3b5ec3a7fe05', 1600, 400), thumbnailUrl: unsplash('1470071459604-3b5ec3a7fe05', 400, 100), credit: 'v2osk', premium: true },
  { id: 'nature-3', category: 'nature', url: unsplash('1441974231531-c6227db76b6e', 1600, 400), thumbnailUrl: unsplash('1441974231531-c6227db76b6e', 400, 100), credit: 'Luca Bravo', premium: true },
  { id: 'nature-4', category: 'nature', url: unsplash('1465146344425-f00d5f5c8f07', 1600, 400), thumbnailUrl: unsplash('1465146344425-f00d5f5c8f07', 400, 100), credit: 'Robert Lukeman', premium: true },
  { id: 'nature-5', category: 'nature', url: unsplash('1500534623283-1cb2d502d73a', 1600, 400), thumbnailUrl: unsplash('1500534623283-1cb2d502d73a', 400, 100), credit: 'Justin Kauffman', premium: true },
  { id: 'nature-6', category: 'nature', url: unsplash('1518173946687-a1e24210a8be', 1600, 400), thumbnailUrl: unsplash('1518173946687-a1e24210a8be', 400, 100), credit: 'Yoal Desurmont', premium: true },

  // Abstract
  { id: 'abstract-1', category: 'abstract', url: unsplash('1557672172-298e090bd0f1', 1600, 400), thumbnailUrl: unsplash('1557672172-298e090bd0f1', 400, 100), credit: 'Pawel Czerwinski', premium: false },
  { id: 'abstract-2', category: 'abstract', url: unsplash('1579546929518-9e396f3cc809', 1600, 400), thumbnailUrl: unsplash('1579546929518-9e396f3cc809', 400, 100), credit: 'Gradienta', premium: true },
  { id: 'abstract-3', category: 'abstract', url: unsplash('1558591710-4b4a1ae0f04d', 1600, 400), thumbnailUrl: unsplash('1558591710-4b4a1ae0f04d', 400, 100), credit: 'Steve Johnson', premium: true },
  { id: 'abstract-4', category: 'abstract', url: unsplash('1550684376-efcbd6e3f031', 1600, 400), thumbnailUrl: unsplash('1550684376-efcbd6e3f031', 400, 100), credit: 'Milad Fakurian', premium: true },
  { id: 'abstract-5', category: 'abstract', url: unsplash('1567095761054-7a02e69e5c43', 1600, 400), thumbnailUrl: unsplash('1567095761054-7a02e69e5c43', 400, 100), credit: 'JJ Ying', premium: true },
  { id: 'abstract-6', category: 'abstract', url: unsplash('1553356084-58ef4a67b2a7', 1600, 400), thumbnailUrl: unsplash('1553356084-58ef4a67b2a7', 400, 100), credit: 'Fakurian Design', premium: true },

  // Minimal
  { id: 'minimal-1', category: 'minimal', url: unsplash('1507003211169-0a1dd7228f2d', 1600, 400), thumbnailUrl: unsplash('1507003211169-0a1dd7228f2d', 400, 100), credit: 'Scott Webb', premium: false },
  { id: 'minimal-2', category: 'minimal', url: unsplash('1494438639946-1ebd1d20bf85', 1600, 400), thumbnailUrl: unsplash('1494438639946-1ebd1d20bf85', 400, 100), credit: 'Joel Filipe', premium: true },
  { id: 'minimal-3', category: 'minimal', url: unsplash('1517816743773-33a7e1c0faba', 1600, 400), thumbnailUrl: unsplash('1517816743773-33a7e1c0faba', 400, 100), credit: 'Patrick Tomasso', premium: true },
  { id: 'minimal-4', category: 'minimal', url: unsplash('1513542789411-b6a5d4f31634', 1600, 400), thumbnailUrl: unsplash('1513542789411-b6a5d4f31634', 400, 100), credit: 'Bench Accounting', premium: true },
  { id: 'minimal-5', category: 'minimal', url: unsplash('1519710164239-da123dc03ef4', 1600, 400), thumbnailUrl: unsplash('1519710164239-da123dc03ef4', 400, 100), credit: 'Samantha Gades', premium: true },
  { id: 'minimal-6', category: 'minimal', url: unsplash('1486312338219-ce68d2c6f44d', 1600, 400), thumbnailUrl: unsplash('1486312338219-ce68d2c6f44d', 400, 100), credit: 'Kari Shea', premium: true },

  // Gradient
  { id: 'gradient-1', category: 'gradient', url: unsplash('1614850523459-c2f4c699c52e', 1600, 400), thumbnailUrl: unsplash('1614850523459-c2f4c699c52e', 400, 100), credit: 'Codioful', premium: false },
  { id: 'gradient-2', category: 'gradient', url: unsplash('1614851099175-e5b30eb6f696', 1600, 400), thumbnailUrl: unsplash('1614851099175-e5b30eb6f696', 400, 100), credit: 'Codioful', premium: true },
  { id: 'gradient-3', category: 'gradient', url: unsplash('1620641788421-7a1c342ea42e', 1600, 400), thumbnailUrl: unsplash('1620641788421-7a1c342ea42e', 400, 100), credit: 'Gradienta', premium: true },
  { id: 'gradient-4', category: 'gradient', url: unsplash('1635776062127-d379bfcba9f8', 1600, 400), thumbnailUrl: unsplash('1635776062127-d379bfcba9f8', 400, 100), credit: 'Gradienta', premium: true },
  { id: 'gradient-5', category: 'gradient', url: unsplash('1618005182384-a83a8bd57fbe', 1600, 400), thumbnailUrl: unsplash('1618005182384-a83a8bd57fbe', 400, 100), credit: 'Gradienta', premium: true },
  { id: 'gradient-6', category: 'gradient', url: unsplash('1557682250-33bd709cbe85', 1600, 400), thumbnailUrl: unsplash('1557682250-33bd709cbe85', 400, 100), credit: 'Gradienta', premium: true },

  // Workspace
  { id: 'workspace-1', category: 'workspace', url: unsplash('1497366216548-37526070297c', 1600, 400), thumbnailUrl: unsplash('1497366216548-37526070297c', 400, 100), credit: 'Aleksi Tappura', premium: false },
  { id: 'workspace-2', category: 'workspace', url: unsplash('1498050108023-c5249f4df085', 1600, 400), thumbnailUrl: unsplash('1498050108023-c5249f4df085', 400, 100), credit: 'Christopher Gower', premium: true },
  { id: 'workspace-3', category: 'workspace', url: unsplash('1519389950473-47ba0277781c', 1600, 400), thumbnailUrl: unsplash('1519389950473-47ba0277781c', 400, 100), credit: 'Marvin Meyer', premium: true },
  { id: 'workspace-4', category: 'workspace', url: unsplash('1497032628192-86f99bcd76bc', 1600, 400), thumbnailUrl: unsplash('1497032628192-86f99bcd76bc', 400, 100), credit: 'Jeff Sheldon', premium: true },
  { id: 'workspace-5', category: 'workspace', url: unsplash('1542744173-8e7e91415657', 1600, 400), thumbnailUrl: unsplash('1542744173-8e7e91415657', 400, 100), credit: 'XPS', premium: true },
  { id: 'workspace-6', category: 'workspace', url: unsplash('1517502884422-41eaead166d4', 1600, 400), thumbnailUrl: unsplash('1517502884422-41eaead166d4', 400, 100), credit: 'Norbert Levajsics', premium: true },

  // Motivational
  { id: 'motivational-1', category: 'motivational', url: unsplash('1519681393784-d120267933ba', 1600, 400), thumbnailUrl: unsplash('1519681393784-d120267933ba', 400, 100), credit: 'Benjamin Voros', premium: false },
  { id: 'motivational-2', category: 'motivational', url: unsplash('1454496522488-7a8e488e8606', 1600, 400), thumbnailUrl: unsplash('1454496522488-7a8e488e8606', 400, 100), credit: 'Joshua Earle', premium: true },
  { id: 'motivational-3', category: 'motivational', url: unsplash('1464822759023-fed622ff2c3b', 1600, 400), thumbnailUrl: unsplash('1464822759023-fed622ff2c3b', 400, 100), credit: 'Kalen Emsley', premium: true },
  { id: 'motivational-4', category: 'motivational', url: unsplash('1470252649378-9c29740c9fa8', 1600, 400), thumbnailUrl: unsplash('1470252649378-9c29740c9fa8', 400, 100), credit: 'Dino Reichmuth', premium: true },
  { id: 'motivational-5', category: 'motivational', url: unsplash('1504280390367-361c6d9f38f4', 1600, 400), thumbnailUrl: unsplash('1504280390367-361c6d9f38f4', 400, 100), credit: 'Scott Goodwill', premium: true },
  { id: 'motivational-6', category: 'motivational', url: unsplash('1682687982501-1e58ab814714', 1600, 400), thumbnailUrl: unsplash('1682687982501-1e58ab814714', 400, 100), credit: 'NEOM', premium: true },

  // Motivation
  { id: 'motivation-1', category: 'motivation', url: unsplash('1490730141103-6cac27aaab94', 1600, 400), thumbnailUrl: unsplash('1490730141103-6cac27aaab94', 400, 100), credit: 'Estee Janssens', premium: false },
  { id: 'motivation-2', category: 'motivation', url: unsplash('1484480974693-6ca0a78fb36b', 1600, 400), thumbnailUrl: unsplash('1484480974693-6ca0a78fb36b', 400, 100), credit: 'Glenn Carstens-Peters', premium: true },
  { id: 'motivation-3', category: 'motivation', url: unsplash('1512486130939-2c4f79935e4f', 1600, 400), thumbnailUrl: unsplash('1512486130939-2c4f79935e4f', 400, 100), credit: 'Cathryn Lavery', premium: true },
  { id: 'motivation-4', category: 'motivation', url: unsplash('1499209974431-9dddcece7f88', 1600, 400), thumbnailUrl: unsplash('1499209974431-9dddcece7f88', 400, 100), credit: 'Estee Janssens', premium: true },
  { id: 'motivation-5', category: 'motivation', url: unsplash('1434030216411-0b793f4b4173', 1600, 400), thumbnailUrl: unsplash('1434030216411-0b793f4b4173', 400, 100), credit: 'Aaron Burden', premium: true },
  { id: 'motivation-6', category: 'motivation', url: unsplash('1455849318743-b2233052fcff', 1600, 400), thumbnailUrl: unsplash('1455849318743-b2233052fcff', 400, 100), credit: 'Ian Schneider', premium: true },
]

export const GALLERY_CATEGORIES: { id: GalleryCategory; labelKey: string }[] = [
  { id: 'nature', labelKey: 'gallery.nature' },
  { id: 'abstract', labelKey: 'gallery.abstract' },
  { id: 'minimal', labelKey: 'gallery.minimal' },
  { id: 'gradient', labelKey: 'gallery.gradient' },
  { id: 'workspace', labelKey: 'gallery.workspace' },
  { id: 'motivational', labelKey: 'gallery.motivational' },
  { id: 'motivation', labelKey: 'gallery.motivation' },
]

export const EMOJI_GRID = [
  '\uD83C\uDFE0', '\u2705', '\uD83D\uDD01', '\uD83C\uDFAF', '\uD83D\uDCB0', '\uD83D\uDCDD', '\uD83D\uDCDA', '\uD83D\uDCC5', '\u23F1\uFE0F', '\uD83E\uDD16',
  '\uD83D\uDE80', '\u2B50', '\uD83D\uDD25', '\uD83C\uDFC6', '\uD83D\uDCA1', '\u2764\uFE0F', '\uD83C\uDF1F', '\uD83C\uDF08', '\uD83D\uDCAA', '\uD83E\uDDE0',
  '\uD83C\uDF3F', '\uD83C\uDF3A', '\u2615', '\uD83C\uDFA8', '\uD83C\uDFB5', '\uD83D\uDCBC', '\u26A1', '\uD83E\uDDED', '\uD83D\uDD12', '\uD83D\uDCE6',
  '\uD83C\uDF0D', '\uD83C\uDF0A', '\u2600\uFE0F', '\uD83C\uDF19', '\uD83D\uDCF7', '\uD83C\uDFA5', '\uD83D\uDCBB', '\uD83D\uDCF1', '\u2708\uFE0F', '\uD83D\uDE97',
]
