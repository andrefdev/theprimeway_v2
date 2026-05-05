import * as React from 'react'
import { ChevronDownIcon, XIcon } from 'lucide-react'

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

export interface ComboboxOption<TValue extends string = string> {
  value: TValue
  label: string
  /** Optional secondary text shown muted next to the label. */
  description?: string
  /** Optional content rendered before the label (e.g. an icon). */
  icon?: React.ReactNode
  /** Optional searchable string. Falls back to `label`. */
  keywords?: string[]
  disabled?: boolean
}

interface ComboboxProps<TValue extends string = string> {
  options: ComboboxOption<TValue>[]
  value: TValue | undefined
  onChange: (value: TValue | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  /** Allow clearing the selection from inside the popover. */
  clearable?: boolean
  clearLabel?: string
  /** Trigger button class. Use to control width. Defaults to `w-full`. */
  className?: string
  /** Popover content class. Width follows trigger by default. */
  contentClassName?: string
  align?: 'start' | 'center' | 'end'
  disabled?: boolean
  id?: string
  name?: string
  /** Optional custom renderer for the selected value in the default trigger. */
  renderValue?: (option: ComboboxOption<TValue>) => React.ReactNode
  /**
   * Optional custom trigger. When provided, replaces the default outline button.
   * Receives the currently selected option (or undefined). The element passed
   * is wrapped with `PopoverTrigger asChild`, so it should accept a ref and
   * forward standard button props.
   */
  trigger?: (selected: ComboboxOption<TValue> | undefined) => React.ReactElement
}

/**
 * Searchable, scrollable single-select combobox.
 *
 * Built on Popover + cmdk so the search input stays pinned at the top and the
 * options scroll inside a bounded list (max-h on `CommandList`). Trigger width
 * propagates to the popover via `--radix-popover-trigger-width` so options
 * never overflow horizontally.
 */
export function Combobox<TValue extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results',
  clearable = false,
  clearLabel = 'Clear',
  className,
  contentClassName,
  align = 'start',
  disabled,
  id,
  name,
  renderValue,
  trigger,
}: ComboboxProps<TValue>) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger(selected)
        ) : (
          <Button
            id={id}
            name={name}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !selected && 'text-muted-foreground',
              className,
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {selected
                ? renderValue
                  ? renderValue(selected)
                  : selected.label
                : placeholder}
            </span>
            <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0',
          contentClassName,
        )}
        align={align}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  keywords={opt.keywords}
                  disabled={opt.disabled}
                  data-checked={opt.value === value}
                  onSelect={() => {
                    onChange(opt.value === value ? undefined : opt.value)
                    setOpen(false)
                  }}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                  {opt.description && (
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {opt.description}
                    </span>
                  )}
                </CommandItem>
              ))}
              {clearable && value !== undefined && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(undefined)
                    setOpen(false)
                  }}
                  className="text-muted-foreground"
                >
                  <XIcon className="size-4" />
                  {clearLabel}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
