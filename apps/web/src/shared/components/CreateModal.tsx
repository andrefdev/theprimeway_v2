import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { useTranslation } from 'react-i18next'

interface CreateModalProps {
  title: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void> | void
  loading?: boolean
  children: ReactNode
  saveButtonText?: string
  cancelButtonText?: string
  isValid?: boolean
  className?: string
}

export function CreateModal({
  title,
  description,
  open,
  onOpenChange,
  onSave,
  loading = false,
  children,
  saveButtonText,
  cancelButtonText,
  isValid = true,
  className,
}: CreateModalProps) {
  const { t: tCommon } = useTranslation('common')
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading && isValid) {
      await onSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-full max-w-2xl gap-0 overflow-auto rounded-lg p-0',
          isMobile ? 'max-h-[90vh] w-[95vw]' : 'max-h-[85vh]',
          className,
        )}
      >
        <DialogHeader className="space-y-1 border-b px-6 py-4">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {children}
          </div>

          <DialogFooter className="bg-muted/10 border-t px-6 py-4">
            <div
              className={cn(
                'flex gap-3',
                isMobile ? 'w-full flex-col' : 'flex-row justify-end',
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className={cn(isMobile && 'w-full')}
              >
                {cancelButtonText || tCommon('actions.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading || !isValid}
                className={cn(isMobile && 'w-full')}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {tCommon('actions.saving')}
                  </>
                ) : (
                  saveButtonText || tCommon('actions.save')
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
