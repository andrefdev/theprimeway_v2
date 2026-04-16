import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ProfileCard } from '@/features/profile/components/ProfileCard'
import { ProfileGamificationStats } from '@/features/profile/components/ProfileGamificationStats'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { t } = useTranslation('profile')

  return (
    <div>
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
        <ProfileCard />
        <ProfileGamificationStats />
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('account')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{t('changePassword')}</p>
                  <p className="text-xs text-muted-foreground">{t('changePasswordDescription')}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings">{t('goToSettings')}</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
