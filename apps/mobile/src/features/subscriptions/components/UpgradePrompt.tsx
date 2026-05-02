import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { Icon } from '@/shared/components/ui/icon';
import { useRouter } from 'expo-router';
import type { FeatureKey } from '@repo/shared/constants';

interface UpgradePromptProps {
  featureKey: FeatureKey;
  title?: string;
  description?: string;
}

const featureMessages: Record<FeatureKey, { title: string; description: string }> = {
  AI_ASSISTANT: {
    title: 'Fenrir AI Unlock',
    description: 'Get unlimited Fenrir AI insights and support. Upgrade to Premium to access this feature.',
  },
  ADVANCED_ANALYTICS: {
    title: 'Advanced Analytics Unlock',
    description: 'Deep dive into your productivity metrics and insights. Upgrade to Premium to access this feature.',
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
  TASKS_LIMIT: {
    title: 'Task Limit Reached',
    description: "You've reached the maximum number of tasks for your plan. Upgrade to Premium for unlimited tasks.",
  },
  POMODORO_DAILY_LIMIT: {
    title: 'Pomodoro Limit Reached',
    description: "You've reached the daily pomodoro limit for your plan. Upgrade to Premium for unlimited sessions.",
  },
};

export function UpgradePrompt({ featureKey, title, description }: UpgradePromptProps) {
  const message = featureMessages[featureKey];
  const finalTitle = title || message.title;
  const finalDescription = description || message.description;
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-4">
        <View className="w-full max-w-md items-center gap-6">
          {/* Icon */}
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <Icon as={Lock} size={32} className="text-primary" />
          </View>

          {/* Title */}
          <Text className="text-center text-2xl font-bold text-foreground">
            {finalTitle}
          </Text>

          {/* Description */}
          <Text className="text-center text-sm text-muted-foreground">
            {finalDescription}
          </Text>

          {/* Buttons */}
          <View className="w-full gap-3 pt-4">
            <Pressable
              onPress={() => router.push('/subscription')}
              className="items-center justify-center rounded-lg bg-primary px-4 py-3 active:bg-primary-hover"
            >
              <Text className="text-center font-semibold text-primary-foreground">
                Upgrade to Premium
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              className="items-center justify-center rounded-lg border border-border px-4 py-3 active:bg-muted"
            >
              <Text className="text-center font-semibold text-foreground">
                Go Back
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
