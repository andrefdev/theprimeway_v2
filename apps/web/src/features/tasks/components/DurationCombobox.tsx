import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'

interface DurationComboboxProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  presets?: number[]
  placeholder?: string
  className?: string
}

const DEFAULT_PRESETS = [15, 30, 45, 60, 90, 120]

export function DurationCombobox({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  placeholder = 'Select duration',
  className,
}: DurationComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const parsed = Number(query)
  const customValid = query.trim() !== '' && !Number.isNaN(parsed) && parsed > 0
  const isCustom = customValid && !presets.includes(parsed)

  function commit(n: number | undefined) {
    onChange(n)
    setQuery('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value ? `${value} min` : placeholder}
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command
          shouldFilter={false}
          filter={() => 1}
        >
          <CommandInput
            placeholder="Minutes…"
            value={query}
            onValueChange={setQuery}
            inputMode="numeric"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isCustom) {
                e.preventDefault()
                commit(parsed)
              }
            }}
          />
          <CommandList>
            <CommandGroup>
              {isCustom && (
                <CommandItem
                  value={`custom-${parsed}`}
                  onSelect={() => commit(parsed)}
                >
                  Use {parsed} min
                </CommandItem>
              )}
              {presets
                .filter((p) => !query || String(p).includes(query))
                .map((p) => (
                  <CommandItem
                    key={p}
                    value={String(p)}
                    data-checked={value === p}
                    onSelect={() => commit(p)}
                  >
                    {p} min
                  </CommandItem>
                ))}
              {value !== undefined && (
                <CommandItem
                  value="clear"
                  onSelect={() => commit(undefined)}
                  className="text-muted-foreground"
                >
                  Clear
                </CommandItem>
              )}
            </CommandGroup>
            <CommandEmpty>Type a number of minutes.</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
