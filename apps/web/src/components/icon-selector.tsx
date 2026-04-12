import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { MinimalIcon } from '@/components/ui/minimal-icon'
import { COOLICON_CATEGORIES } from '@/features/personalization/model/constants'
import {
  // General icons
  Folder,
  FolderOpen,
  File,
  FileText,
  Archive,
  Bookmark,
  BookOpen,
  Calendar,
  Clock,
  Star,
  Heart,
  Lightbulb,
  Target,
  Trophy,
  Award,

  // Work & Business
  Briefcase,
  Building,
  Users,
  User,
  Phone,
  Mail,
  Globe,
  Monitor,
  Laptop,
  Smartphone,

  // Creative & Hobby
  Palette,
  Music,
  Camera,
  Image,
  Video,
  Mic,
  Headphones,
  Guitar,
  Gamepad2,

  // Health & Fitness
  Activity,
  Zap,
  Shield,
  Sun,
  Moon,
  Coffee,
  Apple,

  // Education & Learning
  GraduationCap,
  BookMarked,
  PenTool,
  Edit3,
  Calculator,
  Brain,

  // Finance & Money
  DollarSign,
  CreditCard,
  PiggyBank,
  TrendingUp,
  BarChart3,

  // Travel & Places
  MapPin,
  Plane,
  Car,
  Home,
  Building2,
  Trees,

  // Tech & Tools
  Settings,
  Wrench,
  Code,
  Database,
  Server,
  Wifi,

} from 'lucide-react'

const ICON_CATEGORIES = {
  general: {
    name: 'General',
    icons: [
      { name: 'Folder', component: Folder },
      { name: 'FolderOpen', component: FolderOpen },
      { name: 'File', component: File },
      { name: 'FileText', component: FileText },
      { name: 'Archive', component: Archive },
      { name: 'Bookmark', component: Bookmark },
      { name: 'BookOpen', component: BookOpen },
      { name: 'Calendar', component: Calendar },
      { name: 'Clock', component: Clock },
      { name: 'Star', component: Star },
      { name: 'Heart', component: Heart },
      { name: 'Lightbulb', component: Lightbulb },
      { name: 'Target', component: Target },
      { name: 'Trophy', component: Trophy },
      { name: 'Award', component: Award },
    ],
  },
  work: {
    name: 'Work & Business',
    icons: [
      { name: 'Briefcase', component: Briefcase },
      { name: 'Building', component: Building },
      { name: 'Users', component: Users },
      { name: 'User', component: User },
      { name: 'Phone', component: Phone },
      { name: 'Mail', component: Mail },
      { name: 'Globe', component: Globe },
      { name: 'Monitor', component: Monitor },
      { name: 'Laptop', component: Laptop },
      { name: 'Smartphone', component: Smartphone },
    ],
  },
  creative: {
    name: 'Creative & Hobby',
    icons: [
      { name: 'Palette', component: Palette },
      { name: 'Music', component: Music },
      { name: 'Camera', component: Camera },
      { name: 'Image', component: Image },
      { name: 'Video', component: Video },
      { name: 'Mic', component: Mic },
      { name: 'Headphones', component: Headphones },
      { name: 'Guitar', component: Guitar },
      { name: 'Gamepad2', component: Gamepad2 },
    ],
  },
  health: {
    name: 'Health & Fitness',
    icons: [
      { name: 'Activity', component: Activity },
      { name: 'Zap', component: Zap },
      { name: 'Shield', component: Shield },
      { name: 'Sun', component: Sun },
      { name: 'Moon', component: Moon },
      { name: 'Coffee', component: Coffee },
      { name: 'Apple', component: Apple },
    ],
  },
  education: {
    name: 'Education & Learning',
    icons: [
      { name: 'GraduationCap', component: GraduationCap },
      { name: 'BookMarked', component: BookMarked },
      { name: 'PenTool', component: PenTool },
      { name: 'Edit3', component: Edit3 },
      { name: 'Calculator', component: Calculator },
      { name: 'Brain', component: Brain },
    ],
  },
  finance: {
    name: 'Finance & Money',
    icons: [
      { name: 'DollarSign', component: DollarSign },
      { name: 'CreditCard', component: CreditCard },
      { name: 'PiggyBank', component: PiggyBank },
      { name: 'TrendingUp', component: TrendingUp },
      { name: 'BarChart3', component: BarChart3 },
    ],
  },
  travel: {
    name: 'Travel & Places',
    icons: [
      { name: 'MapPin', component: MapPin },
      { name: 'Plane', component: Plane },
      { name: 'Car', component: Car },
      { name: 'Home', component: Home },
      { name: 'Building2', component: Building2 },
      { name: 'Trees', component: Trees },
    ],
  },
  tech: {
    name: 'Tech & Tools',
    icons: [
      { name: 'Settings', component: Settings },
      { name: 'Wrench', component: Wrench },
      { name: 'Code', component: Code },
      { name: 'Database', component: Database },
      { name: 'Server', component: Server },
      { name: 'Wifi', component: Wifi },
    ],
  },
}

// Emojis populares organizados por categorias
const EMOJI_CATEGORIES = {
  general: [
    '\u{1F4C1}',
    '\u{1F4C2}',
    '\u{1F4C4}',
    '\u{1F4DD}',
    '\u{1F4CB}',
    '\u{1F4CC}',
    '\u2B50',
    '\u2764\uFE0F',
    '\u{1F4A1}',
    '\u{1F3AF}',
    '\u{1F3C6}',
    '\u{1F396}\uFE0F',
  ],
  work: ['\u{1F4BC}', '\u{1F3E2}', '\u{1F465}', '\u{1F464}', '\u{1F4DE}', '\u{1F4E7}', '\u{1F310}', '\u{1F4BB}', '\u{1F4F1}', '\u2699\uFE0F'],
  creative: ['\u{1F3A8}', '\u{1F3B5}', '\u{1F4F7}', '\u{1F5BC}\uFE0F', '\u{1F3AC}', '\u{1F3A4}', '\u{1F3A7}', '\u{1F3B8}', '\u{1F3AE}', '\u270F\uFE0F'],
  health: ['\u26A1', '\u{1F6E1}\uFE0F', '\u2600\uFE0F', '\u{1F319}', '\u2615', '\u{1F34E}', '\u{1F4AA}', '\u{1F3C3}\u200D\u2642\uFE0F', '\u{1F9D8}\u200D\u2640\uFE0F', '\u{1F3E5}'],
  education: ['\u{1F393}', '\u{1F4DA}', '\u270F\uFE0F', '\u{1F9EE}', '\u{1F52C}', '\u{1F9E0}', '\u{1F4D6}', '\u{1F4D0}', '\u{1F392}', '\u{1F4DD}'],
  finance: ['\u{1F4B0}', '\u{1F4B3}', '\u{1F437}', '\u{1F4C8}', '\u{1F4CA}', '\u{1F4B8}', '\u{1F3E6}', '\u{1F4B5}', '\u{1F48E}', '\u{1FA99}'],
  travel: ['\u{1F4CD}', '\u2708\uFE0F', '\u{1F697}', '\u{1F3E0}', '\u{1F3E2}', '\u{1F333}', '\u{1F5FA}\uFE0F', '\u{1F680}', '\u{1F30D}', '\u{1F3D6}\uFE0F'],
  nature: ['\u{1F33F}', '\u{1F338}', '\u2601\uFE0F', '\u{1F327}\uFE0F', '\u2744\uFE0F', '\u{1F33A}', '\u{1F332}', '\u{1F343}', '\u{1F33B}', '\u{1F308}'],
}

interface IconSelectorProps {
  selectedIcon?: string
  selectedColor: string
  onIconChange: (icon: string) => void
  children: React.ReactNode
  translationKey?: string // Para usar diferentes namespace de traducciones
  previewText?: string // Texto personalizable para el preview
}

export function IconSelector({
  selectedIcon,
  selectedColor,
  onIconChange,
  children,
  translationKey = 'features.notes',
  previewText = 'Category Name',
}: IconSelectorProps) {
  const { t } = useTranslation(translationKey)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('icons')

  // Funcion para obtener el componente de icono por nombre
  const getIconComponent = (iconName: string) => {
    for (const category of Object.values(ICON_CATEGORIES)) {
      const icon = category.icons.find((icon) => icon.name === iconName)
      if (icon) return icon.component
    }
    return Folder // Fallback
  }

  // Filtrar iconos por busqueda
  const filteredIcons = Object.entries(ICON_CATEGORIES).reduce(
    (acc, [categoryKey, category]) => {
      const filteredCategoryIcons = category.icons.filter((icon) =>
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      if (filteredCategoryIcons.length > 0) {
        ;(acc as any)[categoryKey] = {
          ...category,
          icons: filteredCategoryIcons,
        }
      }
      return acc
    },
    {} as typeof ICON_CATEGORIES,
  )

  // Filtrar emojis por busqueda
  const filteredEmojis = Object.entries(EMOJI_CATEGORIES).reduce(
    (acc, [categoryKey, emojis]) => {
      const filteredCategoryEmojis = emojis.filter(
        () =>
          !searchQuery || categoryKey.includes(searchQuery.toLowerCase()),
      )
      if (filteredCategoryEmojis.length > 0) {
        ;(acc as any)[categoryKey] = filteredCategoryEmojis
      }
      return acc
    },
    {} as typeof EMOJI_CATEGORIES,
  )

  // Filtrar coolicons por busqueda
  const filteredCoolicons = Object.entries(COOLICON_CATEGORIES).reduce(
    (acc, [categoryKey, category]) => {
      const filtered = category.icons.filter((icon) =>
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      if (filtered.length > 0) {
        ;(acc as any)[categoryKey] = { ...category, icons: filtered }
      }
      return acc
    },
    {} as typeof COOLICON_CATEGORIES,
  )

  const handleIconSelect = (iconName: string) => {
    onIconChange(iconName)
  }

  const handleEmojiSelect = (emoji: string) => {
    onIconChange(emoji)
  }

  const handleCooliconSelect = (iconId: string) => {
    onIconChange(iconId)
  }

  const renderCurrentIcon = () => {
    if (!selectedIcon) {
      return <Folder className="h-4 w-4" style={{ color: selectedColor }} />
    }

    // Si es un emoji (un solo caracter que no esta en nuestros iconos)
    if (selectedIcon.length === 1 || selectedIcon.length === 2) {
      return <span className="text-lg">{selectedIcon}</span>
    }

    // Si es un Coolicon (ci: prefix)
    if (selectedIcon.startsWith('ci:')) {
      return (
        <MinimalIcon
          name={selectedIcon}
          size={16}
          className="shrink-0"
        />
      )
    }

    // Si es un icono de Lucide
    const IconComponent = getIconComponent(selectedIcon)
    return (
      <IconComponent className="h-4 w-4" style={{ color: selectedColor }} />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-4">
          <Input
            placeholder={t('categories.searchIcons')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="coolicons">Coolicons</TabsTrigger>
              <TabsTrigger value="icons">{t('categories.icons')}</TabsTrigger>
              <TabsTrigger value="emojis">{t('categories.emojis')}</TabsTrigger>
            </TabsList>

            <TabsContent value="coolicons" className="mt-3">
              <ScrollArea className="h-72 w-full rounded-md">
                <div className="space-y-4 pr-4">
                  {Object.entries(filteredCoolicons).map(
                    ([categoryKey, category]) => (
                      <div key={categoryKey}>
                        <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-8 gap-1">
                          {category.icons.map((icon) => (
                            <Button
                              key={icon.id}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'hover:bg-accent/80 h-8 w-8 p-1',
                                selectedIcon === icon.id && 'bg-accent',
                              )}
                              onClick={() => handleCooliconSelect(icon.id)}
                              title={icon.name}
                            >
                              <MinimalIcon
                                name={icon.id}
                                size={16}
                                className="shrink-0"
                              />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                  {Object.keys(filteredCoolicons).length === 0 && (
                    <div className="text-muted-foreground py-8 text-center">
                      <p className="text-sm">No icons found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="icons" className="mt-3">
              <ScrollArea className="h-72 w-full rounded-md">
                <div className="space-y-4 pr-4">
                  {Object.entries(filteredIcons).map(
                    ([categoryKey, category]) => (
                      <div key={categoryKey}>
                        <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-8 gap-1">
                          {category.icons.map((icon) => {
                            const IconComponent = icon.component
                            return (
                              <Button
                                key={icon.name}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  'hover:bg-accent/80 h-8 w-8 p-1',
                                  selectedIcon === icon.name && 'bg-accent',
                                )}
                                onClick={() => handleIconSelect(icon.name)}
                              >
                                <IconComponent
                                  className="h-4 w-4"
                                  style={{ color: selectedColor }}
                                />
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ),
                  )}
                  {Object.keys(filteredIcons).length === 0 && (
                    <div className="text-muted-foreground py-8 text-center">
                      <p className="text-sm">No icons found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="emojis" className="mt-3">
              <ScrollArea className="h-72 w-full rounded-md">
                <div className="space-y-4 pr-4">
                  {Object.entries(filteredEmojis).map(
                    ([categoryKey, emojis]) => (
                      <div key={categoryKey}>
                        <h4 className="text-muted-foreground mb-2 text-sm font-medium capitalize">
                          {categoryKey}
                        </h4>
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'hover:bg-accent/80 h-8 w-8 p-1 text-lg',
                                selectedIcon === emoji && 'bg-accent',
                              )}
                              onClick={() => handleEmojiSelect(emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                  {Object.keys(filteredEmojis).length === 0 && (
                    <div className="text-muted-foreground py-8 text-center">
                      <p className="text-sm">No emojis found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-muted/50 border-t p-3">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-sm">
              {t('categories.preview')}:
            </span>
            <div className="flex items-center space-x-1">
              {renderCurrentIcon()}
              <span className="text-sm">{previewText}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Funcion helper para obtener el componente de icono (para usar fuera del selector)
export const getIconComponent = (iconName: string) => {
  for (const category of Object.values(ICON_CATEGORIES)) {
    const icon = category.icons.find((icon) => icon.name === iconName)
    if (icon) return icon.component
  }
  return Folder // Fallback
}

// Helper to check if an icon value is a Coolicon
export const isCoolicon = (iconValue: string) => iconValue.startsWith('ci:')

// Helper to check if an icon value is an emoji
export const isEmoji = (iconValue: string) =>
  iconValue.length === 1 || iconValue.length === 2
