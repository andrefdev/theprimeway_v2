import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrashIcon } from '@/components/Icons'
import { useTranslation } from 'react-i18next'
import { useUpdateBook, useDeleteBook } from '../queries'
import { toast } from 'sonner'
import type { Book } from '@repo/shared/types'

const STATUS_OPTIONS = ['want_to_read', 'reading', 'completed', 'abandoned'] as const

interface BookDetailDialogProps {
  book: Book | null
  open: boolean
  onClose: () => void
}

export function BookDetailDialog({ book, open, onClose }: BookDetailDialogProps) {
  const { t } = useTranslation('reading')
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
  const [currentPage, setCurrentPage] = useState('')
  const [rating, setRating] = useState(0)

  useEffect(() => {
    if (book) {
      setRating(book.rating ?? 0)
      setCurrentPage('')
    }
  }, [book])

  if (!book) return null

  async function handleStatusChange(status: string) {
    try {
      await updateBook.mutateAsync({ id: book!.id, data: { status } })
      toast.success(t('statusUpdated'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleProgressUpdate() {
    const page = parseInt(currentPage, 10)
    if (isNaN(page) || page < 0) return
    try {
      await updateBook.mutateAsync({ id: book!.id, data: { currentPage: page } })
      setCurrentPage('')
      toast.success(t('progressUpdated'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleRating(value: number) {
    setRating(value)
    try {
      await updateBook.mutateAsync({ id: book!.id, data: { rating: value } })
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleDelete() {
    try {
      await deleteBook.mutateAsync(book!.id)
      toast.success(t('bookRemoved'))
      onClose()
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left">{book.title}</DialogTitle>
        </DialogHeader>

        {/* Book info */}
        <div className="flex gap-4">
          <div className="flex h-32 w-22 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-xs">No cover</span>
            )}
          </div>
          <div className="space-y-1.5">
            {book.authors?.length > 0 && (
              <p className="text-sm text-muted-foreground">{book.authors.join(', ')}</p>
            )}
            {book.publishYear && (
              <p className="text-xs text-muted-foreground">{t('published')}: {book.publishYear}</p>
            )}
            {book.pages && (
              <p className="text-xs text-muted-foreground">{book.pages} {t('pages')}</p>
            )}
            {book.subjects?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {book.subjects.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium">{t('changeStatus')}</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={book.status === s ? 'default' : 'outline'}
                onClick={() => handleStatusChange(s)}
                disabled={updateBook.isPending}
                className="text-xs capitalize"
              >
                {s.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Progress */}
        {(book.status === 'reading') && book.pages && (
          <div className="space-y-2">
            <p className="text-xs font-medium">{t('updateProgress')}</p>
            <Progress value={book.progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {book.currentPage}/{book.pages} {t('pages')} ({book.progressPercent}%)
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t('currentPagePlaceholder')}
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="h-8 text-sm"
                min={0}
                max={book.pages}
              />
              <Button size="sm" onClick={handleProgressUpdate} disabled={updateBook.isPending || !currentPage}>
                {t('update')}
              </Button>
            </div>
          </div>
        )}

        {/* Rating */}
        {book.status === 'completed' && (
          <div className="space-y-2">
            <p className="text-xs font-medium">{t('rateBook')}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRating(value)}
                  className="text-lg transition-colors"
                >
                  <span className={value <= rating ? 'text-amber-500' : 'text-muted-foreground/40'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive text-xs">
            <TrashIcon size={12} className="mr-1" />
            {t('removeFromLibrary')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
