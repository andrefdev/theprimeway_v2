import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { BrainViewToggle } from '@/features/brain/graph/BrainViewToggle'
import { BrainGraphContainer } from '@/features/brain/graph/BrainGraphContainer'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/brain/graph')({
  component: BrainGraphPage,
})

function BrainGraphPage() {
  const { t } = useTranslation('brain')
  return (
    <FeatureGate
      feature={FEATURES.BRAIN_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.BRAIN_MODULE} />}
    >
      <div>
        <SectionHeader sectionId="brain" title={t('title')} />
        <div className="mx-auto max-w-6xl px-6 pb-10 space-y-4">
          <BrainViewToggle />
          <FeatureGate
            feature={FEATURES.BRAIN_GRAPH}
            fallback={<UpgradePrompt featureKey={FEATURES.BRAIN_GRAPH} />}
          >
            <BrainGraphContainer />
          </FeatureGate>
        </div>
      </div>
    </FeatureGate>
  )
}
