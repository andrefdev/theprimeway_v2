import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PinIcon, TrashIcon, MoreVerticalIcon } from '@/components/icons'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import type { Note, NoteCategory } from '@repo/shared/types'
import type { Locale } from 'date-fns'

interface NoteCardProps {
  note: Note
  categories: NoteCategory[]
  onDelete: () => void
  onTogglePin: () => void
  dateFnsLocale?: Locale
}

export function NoteCard({ note, categories, onDelete, onTogglePin, dateFnsLocale }: NoteCardProps) {
  const { t } = useTranslation('notes')
  const category = categories.find((c) => c.id === note.categoryId)
  const preview = note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 120) : ''

  return (
    <Card className="group relative transition-colors hover:bg-muted/30">
      <Link to="/notes/$noteId" params={{ noteId: note.id }} className="block">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
              {note.title}
            </h4>
            {note.isPinned && (
              <PinIcon filled className="flex-shrink-0 text-primary mt-0.5" />
            )}
          </div>

          {preview && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
              {preview}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {category && (
              <Badge variant="outline" className="text-[10px]">
                {category.name}
              </Badge>
            )}
            {note.tags && note.tags.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {note.tags.slice(0, 2).map((tag) => `#${tag}`).join(' ')}
                {note.tags.length > 2 && ` +${note.tags.length - 2}`}
              </span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(note.updatedAt), { locale: dateFnsLocale, addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Link>

      {/* Dropdown menu */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.preventDefault()}>
              <MoreVerticalIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onTogglePin() }}>
              <PinIcon size={14} filled={note.isPinned} />
              {note.isPinned ? t('unpin') : t('pin')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={(e) => { e.preventDefault(); onDelete() }}>
              <TrashIcon size={14} />
              {t('delete', { ns: 'common' })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
