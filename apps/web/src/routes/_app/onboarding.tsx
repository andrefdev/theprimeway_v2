import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { OnboardingWizard } from '../../features/onboarding/components/onboarding-wizard'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { t } = useTranslation('onboarding')

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">ThePrimeWay</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
      </div>
      <OnboardingWizard />
    </div>
  )
}
