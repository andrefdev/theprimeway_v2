import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
} from '@/shared/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
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
import {
  Trash2,
  Video,
  ChevronDownIcon,
  Users,
  Eye,
  Bell,
  Calendar as CalendarIcon,
  MapPin,
  X,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
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

const REMINDER_PRESETS: { value: string; label: string }[] = [
  { value: 'default', label: 'Calendar default' },
  { value: '0', label: 'At time of event' },
  { value: '5', label: '5 mins before' },
  { value: '10', label: '10 mins before' },
  { value: '30', label: '30 mins before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
]

const VISIBILITY_LABEL: Record<string, string> = {
  default: 'Calendar default',
  public: 'Public',
  private: 'Private',
}

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
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false)
  const [startTime, setStartTime] = useState(format(initialStart, 'HH:mm'))
  const [endTime, setEndTime] = useState(format(initialEnd, 'HH:mm'))
  const date = format(dateObj, 'yyyy-MM-dd')
  const [colorId, setColorId] = useState(item?.colorId ?? '9')
  const [calendarId, setCalendarId] = useState(item?.googleCalendarId ?? '')
  const [attendees, setAttendees] = useState<string[]>(
    item?.attendees?.map((a) => a.email) ?? [],
  )
  const [attendeeDraft, setAttendeeDraft] = useState('')
  const attendeeInputRef = useRef<HTMLInputElement>(null)
  const [reminder, setReminder] = useState<string>('default')
  const [visibility, setVisibility] = useState<'default' | 'public' | 'private'>(
    (item?.visibility as any) ?? 'default',
  )
  const [hasMeet, setHasMeet] = useState(Boolean(item?.hangoutLink))
  const [meetWasOriginallyOn] = useState(Boolean(item?.hangoutLink))
  const [meetCopied, setMeetCopied] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // Default calendar when in create mode and accounts loaded
  useEffect(() => {
    if (!isEdit && !calendarId && calendarOptions.length > 0) {
      setCalendarId(calendarOptions[0]!.id)
    }
  }, [isEdit, calendarId, calendarOptions])

  const tzLabel = useMemo(() => {
    const offsetMin = -dateObj.getTimezoneOffset()
    const sign = offsetMin >= 0 ? '+' : '-'
    const h = Math.floor(Math.abs(offsetMin) / 60)
    const m = Math.abs(offsetMin) % 60
    const offsetStr = `${sign}${h}:${m.toString().padStart(2, '0')}`
    const city = browserTz.split('/').pop()?.replace(/_/g, ' ') ?? browserTz
    return `(GMT ${offsetStr}) ${city}`
  }, [browserTz, dateObj])

  const colorHex = COLOR_OPTIONS.find((c) => c.id === colorId)?.hex ?? '#3f51b5'

  function commitAttendeeDraft() {
    const raw = attendeeDraft.trim().replace(/[,;]+$/, '').trim()
    if (!raw) return
    const emails = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      .filter((e) => !attendees.includes(e))
    if (emails.length === 0) {
      toast.error('Invalid email')
      return
    }
    setAttendees((cur) => [...cur, ...emails])
    setAttendeeDraft('')
  }

  function handleAttendeeKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault()
      commitAttendeeDraft()
    } else if (e.key === 'Backspace' && !attendeeDraft && attendees.length > 0) {
      e.preventDefault()
      setAttendees((cur) => cur.slice(0, -1))
    }
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

    // Flush pending attendee draft
    if (attendeeDraft.trim()) commitAttendeeDraft()
    const attendeeList = attendees.map((email) => ({ email }))

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
          attendees: attendeeList,
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
          attendees: attendeeList,
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
    try {
      await del.mutateAsync({ calendarId: item.googleCalendarId, eventId: item.googleEventId })
      toast.success('Event deleted')
      setConfirmDeleteOpen(false)
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete')
    }
  }

  async function copyMeetLink() {
    if (!item?.hangoutLink) return
    try {
      await navigator.clipboard.writeText(item.hangoutLink)
      setMeetCopied(true)
      setTimeout(() => setMeetCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            {isEdit ? 'Edit event' : 'New event'}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-full"
          >
            <X size={14} />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Title + Description */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="mt-3.5 size-3 rounded-full ring-offset-2 ring-foreground/20 hover:ring-2 transition shrink-0"
                    style={{ backgroundColor: colorHex }}
                    title="Change color"
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setColorId(c.id)
                          setColorPopoverOpen(false)
                        }}
                        className={cn(
                          'size-6 rounded-full ring-offset-2 transition',
                          colorId === c.id ? 'ring-2 ring-foreground' : 'hover:scale-110',
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title"
                autoFocus
                className="!text-xl font-semibold border-0 focus-visible:ring-0 shadow-none px-3 pr-4 h-auto py-2 min-w-0 flex-1 placeholder:font-normal placeholder:text-muted-foreground/60"
              />
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description here…"
              rows={2}
              className="border-0 focus-visible:ring-0 shadow-none px-3 pr-4 py-2 ml-6 mr-2 resize-none text-sm placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Time row */}
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-[110px] text-base font-semibold border-0 px-1 shadow-none focus-visible:ring-1 [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <ArrowRight size={16} className="text-muted-foreground" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-[110px] text-base font-semibold border-0 px-1 shadow-none focus-visible:ring-1 [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
              <div className="flex items-center gap-2 text-xs ml-1">
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                    >
                      {format(dateObj, 'EEE, MMM d')}
                      <ChevronDownIcon size={12} />
                    </button>
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
                <span className="text-muted-foreground">{tzLabel}</span>
              </div>
            </div>
          </div>

          {/* Metadata rows */}
          <div className="space-y-3 border-t pt-4">
            <Row icon={<Users size={15} />} label="Participants">
              <div
                className="flex flex-wrap items-center gap-1.5 min-h-[28px] cursor-text"
                onClick={() => attendeeInputRef.current?.focus()}
              >
                {attendees.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-muted text-xs pl-2 pr-1 py-0.5"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAttendees((cur) => cur.filter((x) => x !== email))
                      }}
                      className="rounded-full p-0.5 hover:bg-foreground/10"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  ref={attendeeInputRef}
                  value={attendeeDraft}
                  onChange={(e) => setAttendeeDraft(e.target.value)}
                  onKeyDown={handleAttendeeKey}
                  onBlur={() => attendeeDraft.trim() && commitAttendeeDraft()}
                  placeholder={attendees.length === 0 ? 'Add guests by email' : ''}
                  className="flex-1 min-w-[140px] bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </Row>

            <Row icon={<Video size={15} />} label="Conferencing">
              <div className="flex items-center justify-between gap-2">
                {hasMeet && item?.hangoutLink ? (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <a
                      href={item.hangoutLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary underline truncate"
                    >
                      Join Google Meet
                    </a>
                    <button
                      type="button"
                      onClick={copyMeetLink}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      title="Copy link"
                    >
                      {meetCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground flex-1">
                    {hasMeet ? 'Meet link added on save' : 'No conferencing'}
                  </span>
                )}
                <Switch checked={hasMeet} onCheckedChange={setHasMeet} />
              </div>
            </Row>

            <Row icon={<Eye size={15} />} label="Visibility">
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger className="h-7 text-xs border-0 shadow-none px-1 focus:ring-1 w-fit gap-1">
                  <SelectValue>{VISIBILITY_LABEL[visibility]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Calendar default</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row icon={<Bell size={15} />} label="Reminders">
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger className="h-7 text-xs border-0 shadow-none px-1 focus:ring-1 w-fit gap-1">
                  <SelectValue>
                    {REMINDER_PRESETS.find((r) => r.value === reminder)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_PRESETS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>

            {!isEdit && calendarOptions.length > 0 && (
              <Row icon={<CalendarIcon size={15} />} label="Calendar">
                <Select value={calendarId} onValueChange={setCalendarId}>
                  <SelectTrigger className="h-7 text-xs border-0 shadow-none px-1 focus:ring-1 w-fit gap-1">
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
              </Row>
            )}

            <Row icon={<MapPin size={15} />} label="Location">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="h-7 text-xs border-0 shadow-none px-1 focus-visible:ring-1 placeholder:text-muted-foreground/60"
              />
            </Row>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t px-6 py-3 bg-muted/40">
          {isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={del.isPending}
              className="text-destructive gap-1 h-8"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={update.isPending || create.isPending}
              className="h-8"
            >
              {isEdit ? 'Save' : attendees.length > 0 ? 'Send invites' : 'Create'}
            </Button>
          </div>
        </div>

        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                "{item?.title}" will be permanently removed from Google Calendar. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={del.isPending}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[20px_110px_1fr] items-center gap-3 text-xs">
      <span className="text-muted-foreground flex justify-center">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
