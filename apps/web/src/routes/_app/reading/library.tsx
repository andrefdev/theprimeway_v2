import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { readingQueries, useAddBook } from '../../../features/reading/queries'
import { BookCard } from '../../../features/reading/components/book-card'
import { BookDetailDialog } from '../../../features/reading/components/book-detail-dialog'
import { QueryError } from '../../../components/query-error'
import { PlusIcon } from '../../../components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { ReadingNav } from '../../../features/reading/components/reading-nav'
import { toast } from 'sonner'
import { useState } from 'react'
import type { Book } from '@repo/shared/types'

export const Route = createFileRoute('/_app/reading/library')({
  component: LibraryPage,
})

function LibraryPage() {
  const { t } = useTranslation('reading')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const STATUS_OPTIONS = [
    { value: 'all', label: t('filterAll') },
    { value: 'want_to_read', label: t('statusWantToRead') },
    { value: 'reading', label: t('statusReading') },
    { value: 'completed', label: t('statusCompleted') },
    { value: 'abandoned', label: t('statusAbandoned') },
  ]

  const params: Record<string, string> = {}
  if (statusFilter && statusFilter !== 'all') params.status = statusFilter
  if (search) params.search = search

  const booksQuery = useQuery(readingQueries.books(params))
  const books = (booksQuery.data?.data ?? []) as Book[]

  return (
    <div>
      <ReadingNav />
      <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{t('myLibrary')}</h2>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon /> {t('addBook')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {booksQuery.isLoading && <SkeletonList lines={6} />}
        {booksQuery.isError && <QueryError message={t('failedToLoad')} onRetry={() => booksQuery.refetch()} />}

        {!booksQuery.isLoading && !booksQuery.isError && books.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}

        {!booksQuery.isLoading && !booksQuery.isError && books.length === 0 && (
          <EmptyState
            title={search || statusFilter !== 'all' ? t('noMatchingBooks') : t('libraryEmpty')}
            description={search || statusFilter !== 'all' ? t('tryFilters') : t('addFirst')}
          />
        )}
      </div>

      <AddBookDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <BookDetailDialog book={selectedBook} open={!!selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  )
}

function AddBookDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('reading')
  const addBook = useAddBook()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [totalPages, setTotalPages] = useState('')

  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setTitle('')
    setAuthor('')
    setTotalPages('')
  }
  if (open !== prevOpen) setPrevOpen(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await addBook.mutateAsync({
        title: title.trim(),
        authors: author.trim() ? [author.trim()] : undefined,
        pages: totalPages ? parseInt(totalPages) : undefined,
        status: 'want_to_read',
      })
      toast.success(t('bookAdded'))
      onClose()
    } catch {
      toast.error(t('failedToAdd'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('dialogAddBook')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>{t('inputTitle')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('inputTitlePlaceholder')} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>{t('inputAuthor')}</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('inputAuthorPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('inputPages')}</Label>
              <Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder={t('inputPagesPlaceholder')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
            <Button type="submit" disabled={!title.trim() || addBook.isPending}>{t('addBookButton')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
