import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { TargetIcon } from '@/shared/components/Icons'
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
import { goalsQueries } from '@/features/goals/queries'

interface Props {
  value: string | undefined
  onChange: (id: string | undefined) => void
}

export function InlineWeeklyGoalPicker({ value, onChange }: Props) {
  const { t } = useTranslation('tasks')
  const { data: goals = [] } = useQuery({ ...goalsQueries.weeklyGoals() })

  const selected = (goals as any[]).find((g) => g.id === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <TargetIcon size={14} />
          {selected?.title?.slice(0, 18) ?? t('composer.goal', { defaultValue: 'goal' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t('composer.searchGoal', { defaultValue: 'Search goal…' })}
          />
          <CommandList>
            <CommandEmpty>{t('common:noResults', { defaultValue: 'No results' })}</CommandEmpty>
            <CommandGroup>
              {(goals as any[]).map((g) => (
                <CommandItem key={g.id} value={g.title} onSelect={() => onChange(g.id)}>
                  {g.title}
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
