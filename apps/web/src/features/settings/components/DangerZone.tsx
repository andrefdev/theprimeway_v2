import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { useAuthStore } from '@/shared/stores/auth.store'
import { DeleteAccountDialog } from './DeleteAccountDialog'

export function DangerZone() {
  const { t } = useTranslation('settings')
  const logout = useAuthStore((s) => s.logout)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-destructive mb-2">{t('dangerZone')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t('dangerDisclaimer')}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={handleLogout}>
            {t('logout')}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            {t('deleteAccount')}
          </Button>
        </div>

        <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
      </CardContent>
    </Card>
  )
}
