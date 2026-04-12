import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import {
  CheckSquare,
  Repeat2,
  Target,
  Wallet,
  StickyNote,
  Calendar,
  Sparkles,
  ChevronLeft,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';

const FEATURES: { icon: LucideIcon; key: string; color: string }[] = [
  { icon: CheckSquare, key: 'tasks', color: 'text-blue-400' },
  { icon: Repeat2, key: 'habits', color: 'text-violet-400' },
  { icon: Target, key: 'goals', color: 'text-amber-400' },
  { icon: Wallet, key: 'finances', color: 'text-emerald-400' },
  { icon: StickyNote, key: 'notes', color: 'text-cyan-400' },
  { icon: Calendar, key: 'calendar', color: 'text-rose-400' },
];

export default function NotesScreen() {
  const { t } = useTranslation('features.onboarding.completion');
  const { t: tOnboarding } = useTranslation('features.onboarding');

  const handleFinish = () => {
    router.replace('/(app)/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Back button */}
      <View className="px-6 pt-4">
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          <Icon as={ChevronLeft} size={20} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.back')}</Text>
        </Button>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {/* Success Icon */}
        <View className="mb-8 h-20 w-20 items-center justify-center rounded-3xl bg-emerald-400/15">
          <Icon as={Sparkles} size={40} className="text-emerald-400" />
        </View>

        {/* Title */}
        <Text className="mb-3 text-center text-3xl font-bold text-foreground">
          {t('title')}
        </Text>
        <Text className="mb-10 text-center text-base leading-6 text-muted-foreground">
          {t('description')}
        </Text>

        {/* Feature Grid */}
        <View className="w-full flex-row flex-wrap justify-center gap-4">
          {FEATURES.map((feature) => (
            <View
              key={feature.key}
              className="w-[28%] items-center gap-2 rounded-2xl bg-muted/50 py-4"
            >
              <Icon as={feature.icon} size={24} className={feature.color} />
              <Text className="text-xs font-medium text-muted-foreground">
                {t(`features.${feature.key}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-8 pb-6">
        <Button
          size="lg"
          className="w-full"
          onPress={handleFinish}
        >
          <Text className="text-base font-semibold text-primary-foreground">
            {t('button')}
          </Text>
        </Button>

        <Text className="mt-4 text-center text-xs text-muted-foreground">
          {t('settingsHint')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
