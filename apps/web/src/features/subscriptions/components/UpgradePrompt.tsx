import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { FeatureKey } from '@repo/shared/constants'

interface UpgradePromptProps {
  featureKey: FeatureKey
  title?: string
  description?: string
}

const defaultFeatureMessages: Record<FeatureKey, { title: string; description: string }> = {
  AI_ASSISTANT: {
    title: 'AI Assistant Unlock',
    description: 'Get unlimited AI-powered insights and support. Upgrade to Premium to access this feature.',
  },
  READING_MODULE: {
    title: 'Reading Module Unlock',
    description: 'Track and manage your reading goals. Upgrade to Premium to access this feature.',
  },
  FINANCES_MODULE: {
    title: 'Finances Module Unlock',
    description: 'Manage your accounts, debts, income, and investments. Upgrade to Premium to access this feature.',
  },
  NOTES_MODULE: {
    title: 'Notes Module Unlock',
    description: 'Create and organize unlimited notes. Upgrade to Premium to access this feature.',
  },
  HEALTH_MODULE: {
    title: 'Health Module Unlock',
    description: 'Track your health metrics and wellness goals. Upgrade to Premium to access this feature.',
  },
  ADVANCED_ANALYTICS: {
    title: 'Advanced Analytics Unlock',
    description: 'Deep dive into your productivity metrics and insights. Upgrade to Premium to access this feature.',
  },
  CUSTOM_THEME_CREATION: {
    title: 'Custom Themes Unlock',
    description: 'Personalize your experience with custom themes. Upgrade to Premium to access this feature.',
  },
  CUSTOM_THEMES: {
    title: 'Custom Themes Unlock',
    description: 'Personalize your experience with custom themes. Upgrade to Premium to access this feature.',
  },
  EXPORT_DATA: {
    title: 'Data Export Unlock',
    description: 'Export your data in multiple formats. Upgrade to Premium to access this feature.',
  },
  PRIORITY_SUPPORT: {
    title: 'Priority Support Unlock',
    description: 'Get priority support from our team. Upgrade to Premium to access this feature.',
  },
  HABITS_LIMIT: {
    title: 'Habit Limit Reached',
    description: "You've reached the maximum number of habits for your plan. Upgrade to Premium for unlimited habits.",
  },
  GOALS_LIMIT: {
    title: 'Goal Limit Reached',
    description: "You've reached the maximum number of goals for your plan. Upgrade to Premium for unlimited goals.",
  },
  NOTES_LIMIT: {
    title: 'Note Limit Reached',
    description: "You've reached the maximum number of notes for your plan. Upgrade to Premium for unlimited notes.",
  },
  TASKS_LIMIT: {
    title: 'Task Limit Reached',
    description: "You've reached the maximum number of tasks for your plan. Upgrade to Premium for unlimited tasks.",
  },
  POMODORO_DAILY_LIMIT: {
    title: 'Pomodoro Limit Reached',
    description: "You've reached the daily pomodoro limit for your plan. Upgrade to Premium for unlimited sessions.",
  },
}

const featureKeyToTranslationKey: Record<string, string> = {
  READING_MODULE: 'upgradePromptReading',
  FINANCES_MODULE: 'upgradePromptFinances',
  NOTES_MODULE: 'upgradePromptNotes',
  CUSTOM_THEME_CREATION: 'upgradePromptCustomTheme',
  ADVANCED_ANALYTICS: 'upgradePromptAdvancedAnalytics',
}

export function UpgradePrompt({ featureKey, title, description }: UpgradePromptProps) {
  const { t } = useTranslation('subscriptions')
  const message = defaultFeatureMessages[featureKey]

  // Get translated upgrade prompt message if available
  const translationKey = featureKeyToTranslationKey[featureKey]
  const translatedDescription = translationKey ? t(translationKey) : null

  const finalTitle = title || message.title
  const finalDescription = description || translatedDescription || message.description

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{finalTitle}</CardTitle>
          <CardDescription className="text-center">{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link to="/subscription">
            <Button className="w-full">{t('upgradeToPremium')}</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Go Back
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
