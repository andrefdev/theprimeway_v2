import { useEffect } from 'react'
import { toast } from 'sonner'
import { schedulingApi } from '../api'
import { useQueryClient } from '@tanstack/react-query'
import { schedulingKeys } from '../queries'

/**
 * Install a document-level Cmd/Ctrl+Z listener that undoes the most recent
 * not-yet-undone scheduling command. No-op if no command exists.
 *
 * Skips when focus is inside an input/textarea/contentEditable so we don't
 * hijack the browser's text-undo.
 */
export function useUndoShortcut() {
  const qc = useQueryClient()

  useEffect(() => {
    async function handleKey(e: KeyboardEvent) {
      const isUndo = (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z'
      if (!isUndo) return
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
      e.preventDefault()
      try {
        const cmds = await schedulingApi.listCommands(10)
        const cmd = cmds.find((c) => !c.isUndone)
        if (!cmd) {
          toast.info('Nothing to undo')
          return
        }
        await schedulingApi.undoCommand(cmd.id)
        qc.invalidateQueries({ queryKey: ['tasks'] })
        qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
        qc.invalidateQueries({ queryKey: schedulingKeys.commands })
        toast.success(`Undid: ${cmd.type}`)
      } catch (err) {
        toast.error((err as Error).message || 'Undo failed')
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [qc])
}
