import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock as ClockIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import { useUpdateTask } from '@/features/tasks/queries'
import { cn } from '@/shared/lib/utils'

interface Props {
  taskId: string
  value: number | null
  onChange: (minutes: number) => void
}

const PRESETS = [15, 25, 45, 60, 90, 120]

export function FocusDurationField({ taskId, value, onChange }: Props) {
  const { t } = useTranslation('tasks')
  const [open, setOpen] = useState(false)
  const updateTask = useUpdateTask()

  const commit = (minutes: number) => {
    if (minutes < 1 || minutes > 480) return
    onChange(minutes)
    updateTask.mutate({ id: taskId, data: { estimatedDuration: minutes } })
    setOpen(false)
  }

  const label = value
    ? `${value}m`
    : t('focus.setDuration', { defaultValue: 'set duration' })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border-0 bg-transparent px-1 py-0.5',
            'text-base font-medium text-foreground shadow-none',
            'transition-colors hover:bg-muted/40',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            !value && 'text-muted-foreground',
          )}
        >
          <ClockIcon className="size-4 opacity-70" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t('composer.minutes', { defaultValue: 'Minutes…' })}
            inputMode="numeric"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.currentTarget.value.trim()
                const n = Number(target)
                if (Number.isFinite(n) && n >= 1) {
                  e.preventDefault()
                  commit(Math.min(480, Math.floor(n)))
                }
              }
            }}
          />
          <CommandList>
            <CommandGroup>
              {PRESETS.map((m) => (
                <CommandItem key={m} value={String(m)} onSelect={() => commit(m)}>
                  {m} min
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
