import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
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
import { channelsApi } from '@/features/capture/channels-api'

interface Props {
  value: string | undefined
  onChange: (id: string | undefined) => void
}

export function InlineChannelPicker({ value, onChange }: Props) {
  const { t } = useTranslation('tasks')
  const { data: channels = [] } = useQuery({
    queryKey: ['channels', 'list'],
    queryFn: channelsApi.list,
  })
  const selected = channels.find((c: any) => c.id === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="font-mono">#</span>
          {selected?.name ?? t('composer.channel', { defaultValue: 'channel' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t('composer.searchChannel', { defaultValue: 'Search channel…' })}
          />
          <CommandList>
            <CommandEmpty>{t('common:noResults', { defaultValue: 'No results' })}</CommandEmpty>
            <CommandGroup>
              {channels.map((c: any) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => onChange(c.id)}>
                  <span
                    className="mr-2 inline-block size-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </CommandItem>
              ))}
              {value && (
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
