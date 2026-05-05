import { useMemo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import type { BrainConceptNode } from '@repo/shared/types'

interface GraphSearchBarProps {
  concepts: BrainConceptNode[]
  onSelect: (id: string) => void
}

const MAX_RESULTS = 5

export function GraphSearchBar({ concepts, onSelect }: GraphSearchBarProps) {
  const { t } = useTranslation('brain')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return concepts
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, MAX_RESULTS)
  }, [concepts, query])

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function pick(id: string) {
    onSelect(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
            if (e.key === 'Enter' && matches[0]) pick(matches[0].id)
          }}
          placeholder={t('graph.search.placeholder')}
          className="h-8 pl-8 text-sm"
        />
      </div>
      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{t('graph.search.noResults')}</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pick(c.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm',
                      'hover:bg-muted',
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {c.kind} · {c.mentionCount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
