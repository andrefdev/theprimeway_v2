import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import {
  Pencil,
  Trash2,
  ExternalLink,
  Video,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react'
import type { CalendarItem } from '../hooks/use-calendar-items'

interface Props {
  item: CalendarItem | null
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * Google-Calendar-style quick-view popover anchored to the event card.
 * Tracks the anchor's bounding box so it stays at the same vertical height as
 * the card even when the user scrolls or resizes.
 */
export function EventQuickView({ item, anchorEl, open, onClose, onEdit, onDelete }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!open || !anchorEl) {
      setRect(null)
      return
    }
    const update = () => setRect(anchorEl.getBoundingClientRect())
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorEl])

  if (!item) return null

  const sameDay = item.start.toDateString() === item.end.toDateString()
  const timeLine = sameDay
    ? `${format(item.start, 'EEE, MMM d')} · ${format(item.start, 'h:mm a')} – ${format(item.end, 'h:mm a')}`
    : `${format(item.start, 'EEE, MMM d, h:mm a')} – ${format(item.end, 'EEE, MMM d, h:mm a')}`

  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      {rect && (
        <PopoverAnchor asChild>
          <div
            style={{
              position: 'fixed',
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              pointerEvents: 'none',
            }}
          />
        </PopoverAnchor>
      )}
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        collisionPadding={16}
        className="w-80 max-w-[calc(100vw-32px)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span
              className="mt-1.5 size-3 rounded-sm shrink-0"
              style={{ backgroundColor: googleColorIdToHex(item.colorId) ?? colorTokenToHex(item.color) }}
            />
            <div className="min-w-0">
              <div className="text-base font-medium leading-tight break-words">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{timeLine}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-7 -mr-1 -mt-1" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>

        {item.calendarName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarIcon size={12} />
            <span className="truncate">{item.calendarName}</span>
          </div>
        )}

        {item.location && (
          <div className="flex items-start gap-2 text-xs">
            <MapPin size={12} className="mt-0.5 text-muted-foreground shrink-0" />
            <span className="break-words">{item.location}</span>
          </div>
        )}

        {item.description && (
          <div className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-6">
            {item.description}
          </div>
        )}

        {item.attendees && item.attendees.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <Users size={12} className="mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-muted-foreground mb-0.5">
                {item.attendees.length} guest{item.attendees.length === 1 ? '' : 's'}
              </div>
              <ul className="space-y-0.5">
                {item.attendees.slice(0, 5).map((a) => (
                  <li key={a.email} className="truncate">
                    {a.displayName || a.email}
                  </li>
                ))}
                {item.attendees.length > 5 && (
                  <li className="text-muted-foreground">+{item.attendees.length - 5} more</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {item.hangoutLink && (
            <Button asChild size="sm" className="gap-1">
              <a href={item.hangoutLink} target="_blank" rel="noreferrer">
                <Video size={14} />
                Join Meet
              </a>
            </Button>
          )}
          {item.htmlLink && (
            <Button asChild size="sm" variant="outline" className="gap-1">
              <a href={item.htmlLink} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Open
              </a>
            </Button>
          )}
        </div>

        <div className="flex items-center justify-end gap-1 pt-1 border-t">
          <Button variant="ghost" size="sm" className="gap-1" onClick={onDelete}>
            <Trash2 size={14} />
            Delete
          </Button>
          <Button variant="default" size="sm" className="gap-1" onClick={onEdit}>
            <Pencil size={14} />
            Edit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Google Calendar API event color palette (colorId 1-11)
const GOOGLE_EVENT_COLORS: Record<string, string> = {
  '1': '#7986cb', // Lavender
  '2': '#33b679', // Sage
  '3': '#8e24aa', // Grape
  '4': '#e67c73', // Flamingo
  '5': '#f6bf26', // Banana
  '6': '#f4511e', // Tangerine
  '7': '#039be5', // Peacock
  '8': '#616161', // Graphite
  '9': '#3f51b5', // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
}

export function googleColorIdToHex(id?: string): string | undefined {
  if (!id) return undefined
  return GOOGLE_EVENT_COLORS[id]
}

const COLOR_TOKENS: Record<string, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  muted: '#6b7280',
}

function colorTokenToHex(color: string): string {
  return COLOR_TOKENS[color] ?? '#6b7280'
}
