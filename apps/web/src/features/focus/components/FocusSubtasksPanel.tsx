import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '@/features/subtasks/queries'

interface Props {
  taskId: string
}

/**
 * Subtasks checklist shown in Focus Mode left sidebar during running phase
 * (spec §6.3). Toggle check-state optimistically; add inline; delete on hover.
 */
export function FocusSubtasksPanel({ taskId }: Props) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId)
  const createMut = useCreateSubtask(taskId)
  const updateMut = useUpdateSubtask(taskId)
  const deleteMut = useDeleteSubtask(taskId)

  const [draft, setDraft] = useState('')

  async function onAdd() {
    const title = draft.trim()
    if (!title) return
    setDraft('')
    try {
      await createMut.mutateAsync({ title })
    } catch {
      setDraft(title)
    }
  }

  function toggle(id: string, next: boolean) {
    updateMut.mutate({ id, input: { isCompleted: next } })
  }

  const completedCount = subtasks.filter((s) => s.isCompleted).length

  return (
    <aside className="w-full max-w-xs text-left space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Subtasks</div>
        {subtasks.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {completedCount} / {subtasks.length} done
          </div>
        )}
      </div>

      <ul className="space-y-1.5">
        {isLoading && <li className="text-xs text-muted-foreground">Loading…</li>}
        {!isLoading && subtasks.length === 0 && (
          <li className="text-xs text-muted-foreground">No subtasks yet.</li>
        )}
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggle(s.id, !s.isCompleted)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                s.isCompleted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              }`}
              aria-label={s.isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              {s.isCompleted && <Check className="h-3 w-3" />}
            </button>
            <span className={`flex-1 text-sm ${s.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {s.title}
            </span>
            <button
              type="button"
              onClick={() => deleteMut.mutate(s.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              aria-label="Delete subtask"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1 pt-1">
        <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
          placeholder="Add subtask…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </aside>
  )
}
