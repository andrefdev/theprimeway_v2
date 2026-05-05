import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { MoreVertical, Pencil, Trash2, Trash } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  aiQueries,
  useDeleteAllThreadsMutation,
  useDeleteThreadMutation,
  useRenameThreadMutation,
} from '../queries'
import type { ChatThreadSummary } from '../api'

export function ChatHistoryList({
  activeThreadId,
  onSelect,
}: {
  activeThreadId: string | undefined
  onSelect: (id: string) => void
}) {
  const { t, i18n } = useTranslation('ai')
  const { data: threads, isLoading } = useQuery(aiQueries.threads())
  const renameM = useRenameThreadMutation()
  const deleteM = useDeleteThreadMutation()
  const deleteAllM = useDeleteAllThreadsMutation()
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null)

  function relativeDate(iso: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    const startOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / (24 * 60 * 60 * 1000))
    if (diffDays <= 0) return t('today')
    if (diffDays === 1) return t('yesterday')
    if (diffDays < 7) return t('daysAgo', { count: diffDays })
    return d.toLocaleDateString(i18n.language)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          {isLoading && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">…</div>
          )}
          {!isLoading && (!threads || threads.length === 0) && (
            <div className="px-3 py-12 text-center text-sm text-muted-foreground">
              {t('historyEmpty')}
            </div>
          )}
          <ul className="space-y-1">
            {threads?.map((th) => (
              <ThreadRow
                key={th.id}
                thread={th}
                isActive={th.id === activeThreadId}
                relativeDate={relativeDate(th.lastMessageAt ?? th.createdAt)}
                onClick={() => onSelect(th.id)}
                onRenameStart={() => setRenaming({ id: th.id, title: th.title ?? '' })}
                onDelete={() => deleteM.mutate(th.id)}
              />
            ))}
          </ul>
        </div>
      </ScrollArea>

      {threads && threads.length > 0 && (
        <div className="border-t px-3 py-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash className="mr-2 size-4" /> {t('clearAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('clearAllConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('clearAllConfirm')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('back')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteAllM.mutate()}>
                  {t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <RenameDialog
        renaming={renaming}
        onClose={() => setRenaming(null)}
        onSave={(title) => {
          if (renaming) renameM.mutate({ id: renaming.id, title })
          setRenaming(null)
        }}
      />
    </div>
  )
}

function ThreadRow({
  thread,
  isActive,
  relativeDate,
  onClick,
  onRenameStart,
  onDelete,
}: {
  thread: ChatThreadSummary
  isActive: boolean
  relativeDate: string
  onClick: () => void
  onRenameStart: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('ai')
  return (
    <li
      className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted ${
        isActive ? 'bg-muted' : ''
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 flex-col items-start text-left"
      >
        <span className="line-clamp-1 text-sm font-medium">
          {thread.title ?? t('untitled')}
        </span>
        <span className="text-xs text-muted-foreground">{relativeDate}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label={t('actions', { defaultValue: 'Actions' })}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRenameStart}>
            <Pencil className="mr-2 size-3.5" /> {t('rename')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 size-3.5" /> {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function RenameDialog({
  renaming,
  onClose,
  onSave,
}: {
  renaming: { id: string; title: string } | null
  onClose: () => void
  onSave: (title: string) => void
}) {
  const { t } = useTranslation('ai')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (renaming) setValue(renaming.title)
    else setValue('')
  }, [renaming])

  return (
    <Dialog open={!!renaming} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('rename')}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSave(value.trim())
          }}
          maxLength={100}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('back')}
          </Button>
          <Button onClick={() => value.trim() && onSave(value.trim())} disabled={!value.trim()}>
            {t('rename')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

