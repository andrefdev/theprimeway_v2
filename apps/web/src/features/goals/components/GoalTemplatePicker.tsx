import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { useTranslation } from 'react-i18next'

const CATEGORIES = ['fitness', 'career', 'finance', 'learning', 'relationships', 'wellness']

const CATEGORY_ICONS: Record<string, string> = {
  fitness: '\u{1F3CB}',
  career: '\u{1F4BC}',
  finance: '\u{1F4B0}',
  learning: '\u{1F4DA}',
  relationships: '\u{1F91D}',
  wellness: '\u{1F9D8}',
}

interface GoalTemplatePickerProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: any) => void
}

export function GoalTemplatePicker({ open, onClose, onSelectTemplate }: GoalTemplatePickerProps) {
  const { t } = useTranslation('goals')
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]!)

  const { data, isLoading } = useQuery({
    ...goalsQueries.templates(activeCategory),
    enabled: open,
  })

  const templates = Array.isArray(data) ? data : data?.templates ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('templates.title', { defaultValue: 'Goal Templates' })}</DialogTitle>
        </DialogHeader>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {CATEGORY_ICONS[cat]} {t(`templateCategories.${cat}`, { defaultValue: cat.charAt(0).toUpperCase() + cat.slice(1) })}
            </button>
          ))}
        </div>

        {/* Templates list */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading && <div className="h-20 animate-pulse rounded bg-muted" />}

          {!isLoading && templates.length === 0 && (
            <p className="text-xs text-muted-foreground italic">{t('templates.empty', { defaultValue: 'No templates available' })}</p>
          )}

          {templates.map((tmpl: any) => (
            <Card key={tmpl.id ?? tmpl.title} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onSelectTemplate(tmpl)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{tmpl.title}</h4>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]">
                    {t('templates.use', { defaultValue: 'Use' })}
                  </Button>
                </div>
                {tmpl.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
