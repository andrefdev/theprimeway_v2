import { useTranslation } from 'react-i18next'
import { Clock as ClockIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
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

interface Props {
  value: number | undefined
  onChange: (v: number | undefined) => void
  presets?: number[]
}

const DEFAULT_PRESETS = [10, 15, 25, 30, 45, 60, 90, 120]

export function InlineDurationPicker({ value, onChange, presets = DEFAULT_PRESETS }: Props) {
  const { t } = useTranslation('tasks')
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <ClockIcon className="size-3.5" />
          {value ? `${value}m` : t('composer.timebox', { defaultValue: '--:--' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t('composer.minutes', { defaultValue: 'Minutes…' })}
            inputMode="numeric"
          />
          <CommandList>
            <CommandGroup>
              {presets.map((p) => (
                <CommandItem key={p} value={String(p)} onSelect={() => onChange(p)}>
                  {p} min
                </CommandItem>
              ))}
              {value !== undefined && (
                <CommandItem
                  value="clear"
                  onSelect={() => onChange(undefined)}
                  className="text-muted-foreground"
                >
                  {t('common:clear', { defaultValue: 'Clear' })}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
