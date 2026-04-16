import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { useTranslation } from 'react-i18next'
import type { Book } from '@repo/shared/types'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  want_to_read: 'outline',
  reading: 'default',
  completed: 'secondary',
  abandoned: 'destructive',
}

interface BookCardProps {
  book: Book
  onClick: () => void
}

export function BookCard({ book, onClick }: BookCardProps) {
  const { t } = useTranslation('reading')

  return (
    <Card
      className="group cursor-pointer transition-colors hover:bg-muted/30 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="flex gap-3 p-3">
        {/* Cover */}
        <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-muted-foreground text-[10px]">No cover</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-semibold text-foreground line-clamp-2">{book.title}</h4>
          {book.authors?.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">{book.authors.join(', ')}</p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <Badge variant={STATUS_COLORS[book.status] ?? 'outline'} className="text-[10px] capitalize">
              {book.status.replace(/_/g, ' ')}
            </Badge>
            {book.rating && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
              </span>
            )}
          </div>

          {/* Progress bar for reading books */}
          {book.status === 'reading' && book.pages && (
            <div className="space-y-0.5 mt-1.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{book.currentPage}/{book.pages} {t('pages')}</span>
                <span>{book.progressPercent}%</span>
              </div>
              <Progress value={book.progressPercent} className="h-1" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
