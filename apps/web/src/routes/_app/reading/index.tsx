import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { ReadingNav } from '@/features/reading/components/ReadingNav'
import { readingQueries } from '@/features/reading/queries'
import { BookCard } from '@/features/reading/components/BookCard'
import { BookDetailDialog } from '@/features/reading/components/BookDetailDialog'
import { ReadingStats } from '@/features/reading/components/ReadingStats'
import { QueryError } from '@/shared/components/QueryError'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { useState } from 'react'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'
import type { Book } from '@repo/shared/types'

export const Route = createFileRoute('/_app/reading/')({
  component: ReadingPage,
})

function ReadingPage() {
  const { t } = useTranslation('reading')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const booksQuery = useQuery(readingQueries.books({ status: 'reading' }))
  const books = (booksQuery.data?.data ?? []) as Book[]

  return (
    <FeatureGate
      feature={FEATURES.READING_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.READING_MODULE} />}
    >
      <div>
        <ReadingNav />
        <SectionHeader
          sectionId="reading"
          title={t('currentlyReading')}
          description={`${books.length} ${t('booksInProgress')}`}
          actions={
            <Link to="/reading/library" className="text-sm text-primary hover:underline">
              {t('fullLibrary')}
            </Link>
          }
        />
        <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
          {/* Stats */}
          <ReadingStats />

          {booksQuery.isLoading && <SkeletonList lines={4} />}
          {booksQuery.isError && <QueryError message={t('failedToLoad')} onRetry={() => booksQuery.refetch()} />}

          {!booksQuery.isLoading && !booksQuery.isError && books.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
          )}

          {!booksQuery.isLoading && !booksQuery.isError && books.length === 0 && (
            <EmptyState title={t('nothingBeingRead')} description={t('nothingBeingReadDescription')} />
          )}
        </div>

        <BookDetailDialog book={selectedBook} open={!!selectedBook} onClose={() => setSelectedBook(null)} />
      </div>
    </FeatureGate>
  )
}
