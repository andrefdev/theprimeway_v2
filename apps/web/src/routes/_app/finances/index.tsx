import { createFileRoute } from '@tanstack/react-router'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FinancesOverview } from '@/features/finances/components/FinancesOverview'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/finances/')({
  component: FinancesPage,
})

function FinancesPage() {
  return (
    <FeatureGate
      feature={FEATURES.FINANCES_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.FINANCES_MODULE} />}
    >
      <FinancesOverview />
    </FeatureGate>
  )
}
