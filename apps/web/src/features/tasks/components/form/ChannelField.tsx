import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Hash } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Combobox, type ComboboxOption } from '@/shared/components/ui/combobox'
import { channelsApi } from '@/features/capture/channels-api'

interface Props {
  form: UseFormReturn<CreateTaskInput>
  /** "icon" = round button, "inline" = button with label */
  variant?: 'icon' | 'inline'
}

export function ChannelField({ form, variant = 'icon' }: Props) {
  const { t } = useTranslation('tasks')
  const { data: channels = [] } = useQuery({
    queryKey: ['channels', 'list'],
    queryFn: channelsApi.list,
  })
  const channelId = form.watch('channelId') ?? undefined

  const options: ComboboxOption[] = useMemo(
    () =>
      Array.isArray(channels)
        ? (channels as any[]).map((c) => ({
            value: c.id,
            label: `#${c.name}`,
            keywords: [c.name],
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
      value={channelId}
      onChange={(v) => form.setValue('channelId', v ?? null)}
      searchPlaceholder={t('composer.searchChannel', { defaultValue: 'Search channel…' })}
      emptyMessage={t('noChannels', { defaultValue: 'No channels' })}
      clearable
      clearLabel={t('none')}
      contentClassName="w-56"
      align={variant === 'icon' ? 'end' : 'start'}
      trigger={(selected) =>
        variant === 'icon' ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={selected ? selected.label : t('selectChannel', { defaultValue: 'Channel' })}
            className={selected ? 'text-primary' : 'text-muted-foreground'}
          >
            <Hash className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="font-mono">#</span>
            {selected?.label?.replace(/^#/, '') ?? t('composer.channel', { defaultValue: 'channel' })}
          </Button>
        )
      }
    />
  )
}
