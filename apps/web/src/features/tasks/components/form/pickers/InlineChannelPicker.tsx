import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Combobox, type ComboboxOption } from '@/shared/components/ui/combobox'
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

  const options: ComboboxOption[] = useMemo(
    () =>
      Array.isArray(channels)
        ? (channels as any[]).map((c) => ({
            value: c.id,
            label: c.name,
            icon: c.color ? (
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
            ) : undefined,
          }))
        : [],
    [channels],
  )

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      searchPlaceholder={t('composer.searchChannel', { defaultValue: 'Search channel…' })}
      emptyMessage={t('common:noResults', { defaultValue: 'No results' })}
      clearable
      clearLabel={t('common:clear', { defaultValue: 'Clear' })}
      contentClassName="w-56"
      trigger={(selected) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="font-mono">#</span>
          {selected?.label ?? t('composer.channel', { defaultValue: 'channel' })}
        </Button>
      )}
    />
  )
}
