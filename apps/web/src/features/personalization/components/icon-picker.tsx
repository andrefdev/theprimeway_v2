import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { EMOJI_GRID } from '../model/constants'
import { cn } from '@/lib/utils'

interface IconPickerProps {
  currentEmoji: string
  onSelect: (emoji: string) => void
  children: React.ReactNode
}

export function IconPicker({ currentEmoji, onSelect, children }: IconPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_GRID.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-lg',
                emoji === currentEmoji && 'ring-2 ring-primary ring-offset-1',
              )}
              onClick={() => {
                onSelect(emoji)
                setOpen(false)
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
