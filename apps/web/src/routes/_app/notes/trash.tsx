import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { notesQueries, useRestoreNote } from '../../../features/notes/queries'
import { notesApi } from '../../../features/notes/api'
import { SectionHeader } from '@/components/SectionHeader'
import { NotesNav } from '../../../features/notes/components/notes-nav'
import { QueryError } from '../../../components/query-error'
import { TrashIcon } from '../../../components/Icons'
import { useLocale } from '../../../i18n/useLocale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { Note } from '@repo/shared/types'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/upgrade-prompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/notes/trash')({
  component: NotesTrashPage,
})

function NotesTrashPage() {
  const { t } = useTranslation('notes')
  const { dateFnsLocale } = useLocale()
  const trashQuery = useQuery(notesQueries.trash())
  const restoreNote = useRestoreNote()
  const queryClient = useQueryClient()
  const notes: Note[] = trashQuery.data?.data ?? []

  async function handleRestore(id: string) {
    try {
      await restoreNote.mutateAsync(id)
      toast.success(t('noteRestored'))
    } catch {
      toast.error(t('failedToRestore'))
    }
  }

  async function handleEmptyTrash() {
    if (!window.confirm(t('confirmEmptyTrash'))) return
    try {
      await notesApi.emptyTrash()
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
      toast.success(t('trashEmptied'))
    } catch {
      toast.error(t('failedToEmptyTrash'))
    }
  }

  return (
    <FeatureGate
      feature={FEATURES.NOTES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.NOTES_MODULE} />}
    >
    <div>
      <NotesNav />
      <SectionHeader
        sectionId="notes"
        title={t('trash')}
        description={t('trashDescription')}
        actions={
          notes.length > 0 ? (
            <Button variant="destructive" size="sm" onClick={handleEmptyTrash}>
              <TrashIcon size={14} />
              {t('emptyTrash')}
            </Button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {/* Loading */}
        {trashQuery.isLoading && <SkeletonList lines={4} />}

        {/* Error */}
        {trashQuery.isError && (
          <QueryError message={t('failedToLoad')} onRetry={() => trashQuery.refetch()} />
        )}

        {/* Notes */}
        {!trashQuery.isLoading && !trashQuery.isError && (
          <>
            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{note.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('deleted')} {formatDistanceToNow(new Date(note.updatedAt), { locale: dateFnsLocale, addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(note.id)}
                      >
                        {t('restore')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('trashEmpty')}
                description={t('trashEmptyDescription')}
              />
            )}
          </>
        )}
      </div>
    </div>
    </FeatureGate>
  )
}
