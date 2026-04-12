import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  notesQueries,
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
} from '../../../features/notes/queries'
import { notesApi } from '../../../features/notes/api'
import { SectionHeader } from '@/components/SectionHeader'
import { NotesNav } from '../../../features/notes/components/notes-nav'
import { NoteCard } from '../../../features/notes/components/note-card'
import { TagsFilter } from '../../../features/notes/components/tags-filter'
import { QueryError } from '../../../components/query-error'
import { PlusIcon, TrashIcon, EditIcon, TagIcon } from '../../../components/Icons'
import { useLocale } from '../../../i18n/useLocale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/upgrade-prompt'
import { FEATURES } from '@repo/shared/constants'
import { toast } from 'sonner'
import { useState } from 'react'
import type { NoteCategory } from '@repo/shared/types'

export const Route = createFileRoute('/_app/notes/')({
  component: NotesPage,
})

function NotesPage() {
  const { t } = useTranslation('notes')
  const { dateFnsLocale } = useLocale()
  const navigate = useNavigate()
  const notesQuery = useQuery(notesQueries.list())
  const categoriesQuery = useQuery(notesQueries.categories())
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const updateNote = useUpdateNote()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showTagsFilter, setShowTagsFilter] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const categories = categoriesQuery.data?.data ?? []
  const allNotes = notesQuery.data?.data ?? []

  // Filter notes
  const notes = allNotes.filter((note) => {
    if (selectedCategory && note.categoryId !== selectedCategory) return false
    if (selectedTags.length > 0 && !selectedTags.some((tag) => note.tags?.includes(tag))) return false
    if (search) {
      const q = search.toLowerCase()
      return note.title.toLowerCase().includes(q) || note.content?.toLowerCase().includes(q)
    }
    return true
  })

  const pinnedNotes = notes.filter((n) => n.isPinned)
  const otherNotes = notes.filter((n) => !n.isPinned)

  async function handleCreate() {
    try {
      const result = await createNote.mutateAsync({ title: t('untitledNote') })
      toast.success(t('noteCreated'))
      navigate({ to: '/notes/$noteId', params: { noteId: result.data.id } })
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote.mutateAsync(noteId)
      toast.success(t('movedToTrash'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  async function handleTogglePin(noteId: string, isPinned: boolean) {
    try {
      await updateNote.mutateAsync({ id: noteId, data: { isPinned: !isPinned } })
      toast.success(!isPinned ? t('notePinned') : t('noteUnpinned'))
    } catch {
      toast.error(t('failedToSave'))
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      await notesApi.createCategory({ name: newCategoryName.trim() })
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
      setNewCategoryName('')
      toast.success(t('categoryCreated'))
    } catch {
      toast.error(t('failedToCreateCategory'))
    } finally {
      setCreatingCategory(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await notesApi.deleteCategory(id)
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
      if (selectedCategory === id) setSelectedCategory(null)
      toast.success(t('categoryDeleted'))
    } catch {
      toast.error(t('failedToDeleteCategory'))
    }
  }

  // Check if any notes have tags
  const hasTags = allNotes.some((n) => n.tags && n.tags.length > 0)

  return (
    <FeatureGate
      feature={FEATURES.NOTES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.NOTES_MODULE} />}
    >
      <div>
        <NotesNav />
      <SectionHeader
        sectionId="notes"
        title={t('myNotes')}
        description={t('noteCount', { count: allNotes.length })}
        actions={
          <Button onClick={handleCreate} disabled={createNote.isPending}>
            <PlusIcon /> {t('newNote')}
          </Button>
        }
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {/* Search + category filters + tags */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t('filterAll')}
            </button>
            {categories.map((cat: NoteCategory) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCategoryDialog(true)}
              className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={t('manageCategories')}
            >
              <EditIcon size={12} />
            </button>

            {/* Tags filter button */}
            {hasTags && (
              <button
                type="button"
                onClick={() => setShowTagsFilter(true)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                  selectedTags.length > 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <TagIcon size={10} />
                {selectedTags.length > 0 ? `${selectedTags.length} ${t('tagsSelected')}` : t('tags')}
              </button>
            )}
          </div>
        </div>

        {/* Active tag filters */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('filteringByTags')}:</span>
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
              >
                #{tag} &times;
              </Badge>
            ))}
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              {t('clearAll')}
            </button>
          </div>
        )}

        {/* Loading */}
        {notesQuery.isLoading && <SkeletonList lines={5} />}

        {/* Error */}
        {notesQuery.isError && (
          <QueryError message={t('failedToLoad')} onRetry={() => notesQuery.refetch()} />
        )}

        {/* Notes grid */}
        {!notesQuery.isLoading && !notesQuery.isError && (
          <>
            {/* Pinned */}
            {pinnedNotes.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('sectionPinned')}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      categories={categories}
                      onDelete={() => handleDelete(note.id)}
                      onTogglePin={() => handleTogglePin(note.id, note.isPinned)}
                      dateFnsLocale={dateFnsLocale}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other notes */}
            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('sectionNotes')}
                  </h3>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      categories={categories}
                      onDelete={() => handleDelete(note.id)}
                      onTogglePin={() => handleTogglePin(note.id, note.isPinned)}
                      dateFnsLocale={dateFnsLocale}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty */}
            {notes.length === 0 && (
              <EmptyState
                title={search || selectedTags.length > 0 ? t('noMatchingNotes') : t('noNotesYet')}
                description={search || selectedTags.length > 0 ? t('trySearch') : t('createFirst')}
              />
            )}
          </>
        )}

        {/* Category management dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={(v) => { if (!v) setShowCategoryDialog(false) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('manageCategories')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="flex gap-2 mb-4">
              <Input
                placeholder={t('newCategoryPlaceholder')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={!newCategoryName.trim() || creatingCategory}>
                {t('add', { ns: 'common' })}
              </Button>
            </form>
            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((cat: NoteCategory) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noCategoriesYet')}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                {t('close', { ns: 'common' })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tags filter dialog */}
        <TagsFilter
          notes={allNotes}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          open={showTagsFilter}
          onOpenChange={setShowTagsFilter}
        />
      </div>
      </div>
    </FeatureGate>
  )
}
