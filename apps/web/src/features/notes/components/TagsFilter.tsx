import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckIcon, SearchIcon } from '@/components/Icons'
import { useTranslation } from 'react-i18next'
import type { Note } from '@repo/shared/types'

interface TagsFilterProps {
  notes: Note[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagsFilter({ notes, selectedTags, onTagsChange, open, onOpenChange }: TagsFilterProps) {
  const { t } = useTranslation('notes')
  const [search, setSearch] = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach((n) => n.tags?.forEach((tag) => set.add(tag)))
    return Array.from(set).sort()
  }, [notes])

  const filtered = useMemo(() => {
    if (!search.trim()) return allTags
    return allTags.filter((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  }, [allTags, search])

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('filterByTags')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('selectedTags')}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onTagsChange([])}>
                  {t('clearAll')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder={t('searchTags')}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tag list */}
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {search ? t('noTagsFound') : t('noTagsAvailable')}
                </p>
              ) : (
                filtered.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  const count = notes.filter((n) => n.tags?.includes(tag)).length

                  return (
                    <div
                      key={tag}
                      className={`flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-muted ${
                        isSelected ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {isSelected && <CheckIcon size={10} className="text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{tag}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('close', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
