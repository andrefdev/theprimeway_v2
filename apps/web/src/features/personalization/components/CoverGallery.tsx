import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { ImageIcon, XIcon } from 'lucide-react'
import { COVER_GALLERY, type GalleryCategory } from '../model/constants'
import { cn } from '@/shared/lib/utils'

const CATEGORIES: Array<{ key: GalleryCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'landscapes', label: 'Landscapes' },
  { key: 'abstract', label: 'Abstract' },
  { key: 'shapes', label: 'Shapes' },
  { key: 'cyberpunk', label: 'Cyberpunk' },
  { key: 'gradient', label: 'Gradient' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'motivational', label: 'Motivational' },
]

interface CoverGalleryProps {
  selectedUrl?: string | null
  onSelect: (url: string) => void
  onRemove?: () => void
  children: React.ReactNode
}

export function CoverGallery({ selectedUrl, onSelect, onRemove, children }: CoverGalleryProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | 'all'>('all')

  const filtered = activeCategory === 'all'
    ? COVER_GALLERY
    : COVER_GALLERY.filter((img) => img.category === activeCategory)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('chooseCover')}
          </DialogTitle>
        </DialogHeader>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(({ key, label }) => (
            <Button
              key={key}
              variant={activeCategory === key ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveCategory(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Gallery grid */}
        <ScrollArea className="h-80">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pr-3">
            {/* Remove option */}
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  setOpen(false)
                }}
                className="flex aspect-[4/1] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <XIcon className="mr-1.5 h-4 w-4" />
                {t('noImage')}
              </button>
            )}

            {filtered.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  onSelect(img.url)
                  setOpen(false)
                }}
                className={cn(
                  'group relative aspect-[4/1] overflow-hidden rounded-lg transition-all',
                  selectedUrl === img.url
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'hover:ring-1 hover:ring-border',
                )}
              >
                <img
                  src={img.thumbnailUrl}
                  alt={img.credit}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="px-2 pb-1 text-[10px] text-white">{img.credit}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
