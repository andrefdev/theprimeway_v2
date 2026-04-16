import { useState } from 'react'
import { TrashIcon, EditIcon } from './Icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

interface ActionButtonProps {
  onClick: () => void
  className?: string
}

export function DeleteButton({ onClick, className = '' }: ActionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive ${className}`}
      >
        <TrashIcon />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClick()
                setOpen(false)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
