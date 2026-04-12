import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useState } from 'react'
import { useUpdateProfile } from '../queries'
import { useAuthStore } from '../../../stores/auth.store'
import { useLocale } from '../../../i18n/useLocale'
import { format } from 'date-fns'

export function ProfileCard() {
  const { t } = useTranslation('profile')
  const { dateFnsLocale } = useLocale()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const updateProfile = useUpdateProfile()

  const [name, setName] = useState(user?.name || '')

  async function handleSave() {
    if (!name.trim()) return
    try {
      const res = await updateProfile.mutateAsync({ name: name.trim() })
      if (user) {
        setUser({ ...user, name: res.data.data.name })
      }
      toast.success(t('profileUpdated'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), 'MMMM d, yyyy', { locale: dateFnsLocale })
    : null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{user?.name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {memberSince && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('memberSince', { date: memberSince })}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('email')}</Label>
            <Input value={user?.email || ''} readOnly className="bg-muted" />
            <p className="text-xs text-muted-foreground">{t('emailReadonly')}</p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || !name.trim() || name === user?.name}
            >
              {t('saveProfile')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
