import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Hash, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
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
  const channelId = form.watch('channelId')
  const selected = channels.find((c: any) => c.id === channelId)

  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={selected ? `#${selected.name}` : t('selectChannel', { defaultValue: 'Channel' })}
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
            {selected?.name ?? t('composer.channel', { defaultValue: 'channel' })}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <button
          type="button"
          onClick={() => form.setValue('channelId', null)}
          className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        >
          <span className="text-muted-foreground">{t('none')}</span>
          {!channelId && <Check className="h-3.5 w-3.5" />}
        </button>
        {channels.map((c: any) => (
          <button
            key={c.id}
            type="button"
            onClick={() => form.setValue('channelId', c.id)}
            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span>#{c.name}</span>
            {channelId === c.id && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
        {channels.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            {t('noChannels', { defaultValue: 'No channels' })}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
