import { cn } from '@/shared/lib/utils'
import { useSectionCustomization, useUpdateCustomization } from '@/features/personalization/queries'
import { DEFAULT_SECTION_EMOJIS } from '@/features/personalization/model/constants'
import { IconPicker } from '@/features/personalization/components/IconPicker'
import { CoverGallery } from '@/features/personalization/components/CoverGallery'
import { ImageIcon } from 'lucide-react'
import type { SectionId } from '@/features/personalization/model/types'

// Default cover gradients per section
const SECTION_COVERS: Record<string, string> = {
  dashboard:    'from-indigo-500/20 via-purple-500/10 to-transparent',
  tasks:        'from-blue-500/20 via-cyan-500/10 to-transparent',
  habits:       'from-emerald-500/20 via-green-500/10 to-transparent',
  goals:        'from-amber-500/20 via-orange-500/10 to-transparent',
  finances:     'from-green-500/20 via-emerald-500/10 to-transparent',
  notes:        'from-violet-500/20 via-purple-500/10 to-transparent',
  reading:      'from-rose-500/20 via-pink-500/10 to-transparent',
  calendar:     'from-sky-500/20 via-blue-500/10 to-transparent',
  pomodoro:     'from-red-500/20 via-orange-500/10 to-transparent',
  gamification: 'from-yellow-500/20 via-amber-500/10 to-transparent',
  ai:           'from-fuchsia-500/20 via-violet-500/10 to-transparent',
  subscription: 'from-teal-500/20 via-cyan-500/10 to-transparent',
}

const SECTION_EMOJIS: Record<string, string> = {
  ...DEFAULT_SECTION_EMOJIS,
  gamification: '\uD83C\uDFC6',
  subscription: '\u2B50',
}

const PERSONALIZABLE_SECTIONS = new Set<string>([
  'dashboard', 'tasks', 'habits', 'goals', 'finances',
  'notes', 'reading', 'calendar', 'pomodoro', 'ai',
])

interface SectionHeaderProps {
  sectionId: string
  title: string
  description?: string
  actions?: React.ReactNode
  coverUrl?: string
}

export function SectionHeader({
  sectionId,
  title,
  description,
  actions,
  coverUrl: propCoverUrl,
}: SectionHeaderProps) {
  const isPersonalizable = PERSONALIZABLE_SECTIONS.has(sectionId)
  const customization = isPersonalizable
    ? useSectionCustomization(sectionId as SectionId)
    : null
  const updateCustomization = useUpdateCustomization()

  const gradient = SECTION_COVERS[sectionId] || SECTION_COVERS.dashboard
  const defaultEmoji = SECTION_EMOJIS[sectionId] || '\uD83D\uDCCB'

  // Resolved values: customization > props > defaults
  const coverImageUrl = customization?.coverImageUrl ?? propCoverUrl ?? null
  const emoji = customization?.iconValue ?? defaultEmoji
  const coverPositionY = customization?.coverPositionY ?? 50

  const handleEmojiSelect = (newEmoji: string) => {
    if (!isPersonalizable) return
    updateCustomization.mutate({
      sectionId: sectionId as SectionId,
      iconType: 'emoji',
      iconValue: newEmoji,
    })
  }

  const handleCoverSelect = (url: string) => {
    if (!isPersonalizable) return
    updateCustomization.mutate({
      sectionId: sectionId as SectionId,
      coverImageUrl: url,
      coverImageType: 'gallery',
    })
  }

  const handleCoverRemove = () => {
    if (!isPersonalizable) return
    updateCustomization.mutate({
      sectionId: sectionId as SectionId,
      coverImageUrl: null,
      coverImageType: 'none',
    })
  }

  return (
    <div className="mb-6">
      {/* Cover — full width */}
      {isPersonalizable ? (
        <div className="group relative h-28 w-full overflow-hidden sm:h-36">
          {coverImageUrl ? (
            <>
              <img
                src={coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: `center ${coverPositionY}%` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background via-background/40 to-transparent" />
            </>
          ) : (
            <div className={cn('h-full w-full bg-gradient-to-b', gradient)} />
          )}
          <div className="absolute inset-0 flex items-start justify-end p-2 pointer-events-none">
            <CoverGallery
              selectedUrl={coverImageUrl}
              onSelect={handleCoverSelect}
              onRemove={handleCoverRemove}
            >
              <button
                type="button"
                className="pointer-events-auto flex items-center gap-1.5 rounded-md bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Change cover
              </button>
            </CoverGallery>
          </div>
        </div>
      ) : (
        <div className="relative h-28 overflow-hidden sm:h-36">
          {propCoverUrl ? (
            <>
              <img
                src={propCoverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background via-background/40 to-transparent" />
            </>
          ) : (
            <div className={cn('h-full w-full bg-gradient-to-b', gradient)} />
          )}
        </div>
      )}

      {/* Title area — constrained to match page content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 -mt-5">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon badge */}
            {isPersonalizable ? (
              <IconPicker currentEmoji={emoji} onSelect={handleEmojiSelect}>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-xl shadow-sm transition-colors hover:bg-muted"
                  title="Change icon"
                >
                  {emoji}
                </button>
              </IconPicker>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-xl shadow-sm">
                {emoji}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
