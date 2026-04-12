import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { notesQueries, useUpdateNote, useDeleteNote } from '../../../features/notes/queries'
import { QueryError } from '../../../components/QueryError'
import { ChevronLeftIcon, PinIcon, TrashIcon } from '../../../components/Icons'
import { useLocale } from '../../../i18n/useLocale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { toast } from 'sonner'
import { TipTapEditor } from '../../../components/editor/TiptapEditor'
import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { NoteCategory } from '@repo/shared/types'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/notes/$noteId')({
  component: NoteEditorPage,
})

function NoteEditorPage() {
  const { t } = useTranslation('notes')
  const { dateFnsLocale } = useLocale()
  const { noteId } = Route.useParams()
  const navigate = useNavigate()
  const noteQuery = useQuery(notesQueries.detail(noteId))
  const categoriesQuery = useQuery(notesQueries.categories())
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [isPinned, setIsPinned] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const note = noteQuery.data?.data
  const categories = categoriesQuery.data?.data ?? []

  // Initialize form when note loads
  useEffect(() => {
    if (note && !initialized) {
      setTitle(note.title)
      setContent(note.content ?? '')
      setCategoryId(note.categoryId || 'none')
      setIsPinned(note.isPinned)
      setInitialized(true)
    }
  }, [note, initialized])

  // Auto-save with debounce
  const autoSave = useCallback(
    (updates: Record<string, unknown>) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateNote.mutateAsync({ id: noteId, data: updates as any })
        } catch {
          toast.error(t('failedToSave'))
        }
      }, 800)
    },
    [noteId, updateNote],
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  function handleTitleChange(value: string) {
    setTitle(value)
    autoSave({ title: value || t('untitledNote'), content, categoryId: categoryId !== 'none' ? categoryId : null, isPinned })
  }

  function handleContentChange(value: string) {
    setContent(value)
    autoSave({ title: title || t('untitledNote'), content: value, categoryId: categoryId !== 'none' ? categoryId : null, isPinned })
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value)
    autoSave({ title: title || t('untitledNote'), content, categoryId: value !== 'none' ? value : null, isPinned })
  }

  async function handleTogglePin() {
    const newPinned = !isPinned
    setIsPinned(newPinned)
    try {
      await updateNote.mutateAsync({
        id: noteId,
        data: { isPinned: newPinned },
      })
      toast.success(newPinned ? t('notePinned') : t('noteUnpinned'))
    } catch {
      setIsPinned(!newPinned)
      toast.error(t('failedToSave'))
    }
  }

  async function handleDelete() {
    try {
      await deleteNote.mutateAsync(noteId)
      toast.success(t('movedToTrash'))
      navigate({ to: '/notes' })
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  const categoryOptions = [
    { value: 'none', label: t('noCategory') },
    ...categories.map((c: NoteCategory) => ({ value: c.id, label: c.name })),
  ]

  return (
    <FeatureGate
      feature={FEATURES.NOTES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.NOTES_MODULE} />}
    >
    <div>
      <div className="p-6">
        {/* Back + actions bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/notes" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon />
            {t('backToNotes')}
          </Link>
          <div className="flex items-center gap-2">
            {updateNote.isPending && (
              <span className="text-xs text-muted-foreground">{t('saving')}</span>
            )}
            {note && (
              <span className="text-xs text-muted-foreground">
                {t('edited')} {formatDistanceToNow(new Date(note.updatedAt), { locale: dateFnsLocale, addSuffix: true })}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleTogglePin} title={isPinned ? t('unpin') : t('pin')}>
              <PinIcon size={16} filled={isPinned} className={isPinned ? 'text-primary' : ''} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} title={t('delete', { ns: 'common' })}>
              <TrashIcon size={16} className="text-destructive" />
            </Button>
          </div>
        </div>

        {/* Loading */}
        {noteQuery.isLoading && <SkeletonList lines={8} />}

        {/* Error */}
        {noteQuery.isError && (
          <QueryError message={t('failedToLoad')} onRetry={() => noteQuery.refetch()} />
        )}

        {/* Editor */}
        {initialized && (
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Category select */}
            <div className="flex items-center gap-3">
              <Select value={categoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isPinned && <Badge variant="default">{t('pinned')}</Badge>}
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={t('untitledNote')}
              className="w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />

            {/* Rich text editor */}
            <TipTapEditor
              content={content}
              onChange={handleContentChange}
              placeholder={t('startWriting')}
            />
          </div>
        )}
      </div>
    </div>
    </FeatureGate>
  )
}
