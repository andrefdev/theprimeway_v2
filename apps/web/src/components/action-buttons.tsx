import { TrashIcon, EditIcon } from './icons'

interface ActionButtonProps {
  onClick: () => void
  className?: string
}

export function DeleteButton({ onClick, className = '' }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive ${className}`}
    >
      <TrashIcon />
    </button>
  )
}

export function EditButton({ onClick, className = '' }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground ${className}`}
    >
      <EditIcon />
    </button>
  )
}
