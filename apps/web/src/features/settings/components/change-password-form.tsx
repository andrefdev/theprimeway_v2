import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useState } from 'react'
import { useChangePassword } from '../queries'

export function ChangePasswordForm() {
  const { t } = useTranslation('settings')
  const changePassword = useChangePassword()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t('passwordTooShort'))
      return
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      toast.success(t('passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error(t('failedToChangePassword'))
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('changePassword')}</h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('currentPassword')}</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('newPassword')}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('confirmPassword')}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="outline"
              disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending}
            >
              {t('changePasswordButton')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
