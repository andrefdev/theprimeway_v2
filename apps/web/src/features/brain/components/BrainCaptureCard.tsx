import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Brain } from 'lucide-react'
import { useCreateBrainEntry } from '../queries'

/**
 * Text capture entry point — inline on the /brain page.
 * Phase 1: textarea + Ctrl+Enter submit. Audio comes in Phase 2.
 */
export function BrainCaptureCard() {
  const { t } = useTranslation('brain')
  const [value, setValue] = useState('')
  const createMut = useCreateBrainEntry()

  async function submit() {
    const content = value.trim()
    if (!content) return
    try {
      await createMut.mutateAsync(content)
      setValue('')
      toast.success(t('capture.captured'))
    } catch {
      // Errors surface via global MutationCache toast + axios 401 refresh interceptor.
    }
  }

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('capture.heading')}</h3>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={t('capture.placeholder')}
          rows={3}
          className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{t('capture.hint')}</span>
          <Button size="sm" onClick={submit} disabled={!value.trim() || createMut.isPending}>
            {createMut.isPending ? t('capture.saving') : t('capture.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
