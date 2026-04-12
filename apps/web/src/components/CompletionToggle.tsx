import { CheckIcon } from './Icons'

interface CompletionToggleProps {
  completed: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}

const checkSizes = {
  sm: 8,
  md: 10,
}

export function CompletionToggle({ completed, onClick, size = 'md', className = '' }: CompletionToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${sizeClasses[size]} ${
        completed
          ? 'border-primary bg-primary text-white'
          : 'border-muted-foreground/40 hover:border-primary'
      } ${className}`}
    >
      {completed && <CheckIcon size={checkSizes[size]} />}
    </button>
  )
}
