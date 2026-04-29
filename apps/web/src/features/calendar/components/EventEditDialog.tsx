import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { Calendar } from '@/shared/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Trash2, X, Plus, Video, ChevronDownIcon } from 'lucide-react'
import {
  calendarQueries,
  useCreateTimeBlock,
  useDeleteGoogleEvent,
  useUpdateGoogleEvent,
} from '../queries'
import type { CalendarItem } from '../hooks/use-calendar-items'

interface Props {
  open: boolean
  onClose: () => void
  /** When provided → edit mode. Otherwise → create mode. */
  item?: CalendarItem | null
  /** Defaults for create mode. */
  defaultStart?: Date
  defaultEnd?: Date
}

const COLOR_OPTIONS: { id: string; label: string; hex: string }[] = [
  { id: '1', label: 'Lavender', hex: '#7986cb' },
  { id: '2', label: 'Sage', hex: '#33b679' },
  { id: '3', label: 'Grape', hex: '#8e24aa' },
  { id: '4', label: 'Flamingo', hex: '#e67c73' },
  { id: '5', label: 'Banana', hex: '#f6bf26' },
  { id: '6', label: 'Tangerine', hex: '#f4511e' },
  { id: '7', label: 'Peacock', hex: '#039be5' },
  { id: '8', label: 'Graphite', hex: '#616161' },
  { id: '9', label: 'Blueberry', hex: '#3f51b5' },
  { id: '10', label: 'Basil', hex: '#0b8043' },
  { id: '11', label: 'Tomato', hex: '#d50000' },
]

const REMINDER_PRESETS: { value: string; label: string; minutes: number | null }[] = [
  { value: 'default', label: 'Use calendar default', minutes: null },
  { value: '0', label: 'At time of event', minutes: 0 },
  { value: '5', label: '5 minutes before', minutes: 5 },
  { value: '10', label: '10 minutes before', minutes: 10 },
  { value: '30', label: '30 minutes before', minutes: 30 },
  { value: '60', label: '1 hour before', minutes: 60 },
  { value: '1440', label: '1 day before', minutes: 1440 },
]

export function EventEditDialog({ open, onClose, item, defaultStart, defaultEnd }: Props) {
  const isEdit = Boolean(item?.googleEventId && item?.googleCalendarId)
  const browserTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const accountsQuery = useQuery(calendarQueries.accounts())
  const update = useUpdateGoogleEvent()
  const del = useDeleteGoogleEvent()
  const create = useCreateTimeBlock()

  const calendarOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = []
    for (const acc of accountsQuery.data ?? []) {
      for (const cal of acc.calendars ?? []) {
        opts.push({
          id: (cal as any).providerCalendarId ?? cal.id,
          name: cal.name + (cal.isPrimary ? ' (primary)' : ''),
        })
      }
    }
    return opts
  }, [accountsQuery.data])

  const initialStart = item?.start ?? defaultStart ?? new Date()
  const initialEnd = item?.end ?? defaultEnd ?? new Date(initialStart.getTime() + 30 * 60_000)

  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [location, setLocation] = useState(item?.location ?? '')
  const [dateObj, setDateObj] = useState<Date>(initialStart)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [startTime, setStartTime] = useState(format(initialStart, 'HH:mm'))
  const [endTime, setEndTime] = useState(format(initialEnd, 'HH:mm'))
  const date = format(dateObj, 'yyyy-MM-dd')
  const [colorId, setColorId] = useState(item?.colorId ?? '9')
  const [calendarId, setCalendarId] = useState(item?.googleCalendarId ?? '')
  const [attendeesText, setAttendeesText] = useState(
    item?.attendees?.map((a) => a.email).join(', ') ?? '',
  )
  const [reminder, setReminder] = useState<string>('default')
  const [visibility, setVisibility] = useState<'default' | 'public' | 'private'>(
    (item?.visibility as any) ?? 'default',
  )
  const [hasMeet, setHasMeet] = useState(Boolean(item?.hangoutLink))
  const [meetWasOriginallyOn] = useState(Boolean(item?.hangoutLink))

  // Default calendar when in create mode and accounts loaded
  useEffect(() => {
    if (!isEdit && !calendarId && calendarOptions.length > 0) {
      setCalendarId(calendarOptions[0]!.id)
    }
  }, [isEdit, calendarId, calendarOptions])

  function parseAttendees(): { email: string }[] {
    return attendeesText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      .map((email) => ({ email }))
  }

  function buildReminders() {
    if (reminder === 'default') return { useDefault: true }
    const minutes = Number(reminder)
    if (Number.isNaN(minutes)) return { useDefault: true }
    return {
      useDefault: false,
      overrides: [{ method: 'popup' as const, minutes }],
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!date || !startTime || !endTime) {
      toast.error('Date and times are required')
      return
    }

    try {
      if (isEdit && item?.googleCalendarId && item.googleEventId) {
        const patch = {
          title,
          description,
          location,
          date,
          startTime,
          endTime,
          timeZone: browserTz,
          colorId,
          attendees: parseAttendees(),
          reminders: buildReminders(),
          visibility,
          ...(hasMeet && !meetWasOriginallyOn ? { addGoogleMeet: true } : {}),
          ...(!hasMeet && meetWasOriginallyOn ? { removeGoogleMeet: true } : {}),
        }
        await update.mutateAsync({
          calendarId: item.googleCalendarId,
          eventId: item.googleEventId,
          body: patch,
        })
        toast.success('Event updated')
      } else {
        if (!calendarId) {
          toast.error('Select a calendar')
          return
        }
        await create.mutateAsync({
          title,
          date,
          startTime,
          endTime,
          description: description || undefined,
          location: location || undefined,
          color: colorId,
          timeZone: browserTz,
          attendees: parseAttendees(),
          reminders: buildReminders(),
          addGoogleMeet: hasMeet || undefined,
          calendarId,
        })
        toast.success(hasMeet ? 'Event created with Meet link' : 'Event created')
      }
      onClose()
    } catch (e: any) {
      const errMsg = e?.response?.data?.error ?? e?.message ?? 'Failed to save event'
      toast.error(errMsg)
    }
  }

  async function handleDelete() {
    if (!item?.googleCalendarId || !item.googleEventId) return
    if (!window.confirm('Delete this event from Google Calendar?')) return
    try {
      await del.mutateAsync({ calendarId: item.googleCalendarId, eventId: item.googleEventId })
      toast.success('Event deleted')
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <Label htmlFor="event-date">Date</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="event-date"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {format(dateObj, 'PPP')}
                    <ChevronDownIcon size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateObj}
                    captionLayout="dropdown"
                    defaultMonth={dateObj}
                    onSelect={(d) => {
                      if (d) {
                        setDateObj(d)
                        setDatePopoverOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5 w-28">
              <Label htmlFor="event-start">Start</Label>
              <Input
                id="event-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
            <div className="space-y-1.5 w-28">
              <Label htmlFor="event-end">End</Label>
              <Input
                id="event-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add a location"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-attendees">Guests</Label>
            <Input
              id="event-attendees"
              value={attendeesText}
              onChange={(e) => setAttendeesText(e.target.value)}
              placeholder="email@example.com, another@example.com"
            />
            <p className="text-[11px] text-muted-foreground">
              Comma- or space-separated emails
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorId(c.id)}
                    className={
                      'size-6 rounded-full ring-offset-2 transition ' +
                      (colorId === c.id ? 'ring-2 ring-foreground' : 'hover:scale-110')
                    }
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Calendar default</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Reminder</Label>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_PRESETS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Calendar</Label>
                <Select value={calendarId} onValueChange={setCalendarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-muted-foreground" />
              <div>
                <Label htmlFor="event-meet" className="cursor-pointer">
                  Add Google Meet
                </Label>
                {item?.hangoutLink && hasMeet && (
                  <a
                    href={item.hangoutLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[11px] text-primary underline truncate max-w-[280px]"
                  >
                    {item.hangoutLink}
                  </a>
                )}
              </div>
            </div>
            <Switch id="event-meet" checked={hasMeet} onCheckedChange={setHasMeet} />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={del.isPending}
              className="text-destructive gap-1"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={update.isPending || create.isPending}
            >
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Re-export icons used by parent components if needed
export { Plus as PlusIcon, X as CloseIcon }
