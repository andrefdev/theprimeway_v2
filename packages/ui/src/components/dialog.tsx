import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className = '' }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function handleClose() {
      onClose()
    }

    function handleClick(e: MouseEvent) {
      if (e.target === dialog) onClose()
    }

    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={`m-auto max-h-[85vh] w-full max-w-lg rounded-2xl border border-border/40 bg-card p-0 text-foreground shadow-2xl shadow-black/20 backdrop:bg-black/50 ${className}`}
    >
      {open && children}
    </dialog>
  )
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-border/30 ${className}`}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-[15px] font-semibold text-foreground ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-[13px] text-muted-foreground ${className}`}>{children}</p>
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-y-auto px-6 py-5 ${className}`}>
      {children}
    </div>
  )
}

export function DialogFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t border-border/30 px-6 py-3.5 ${className}`}>
      {children}
    </div>
  )
}
