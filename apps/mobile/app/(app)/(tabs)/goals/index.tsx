import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Target,
  BookOpen,
  FileText,
  Bot,
  Calendar,
  Timer,
  User,
  Settings,
  CreditCard,
  Bell,
  Compass,
  CheckCircle2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useVisions } from '@/features/goals/hooks/useGoals';

interface HubItem {
  icon: LucideIcon;
  label: string;
  route: string;
  iconClass: string;
  bgClass: string;
}


function HubGrid({ items, delay = 0 }: { items: HubItem[]; delay?: number }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map((item, index) => (
        <Animated.View
          key={item.label}
          entering={FadeInDown.delay(delay + index * 50).duration(280)}
          className="w-[47%] flex-grow"
        >
          <Pressable
            className="items-center rounded-2xl border border-border bg-card px-2 py-5 active:bg-muted"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.route as any);
            }}
          >
            <View className={`h-12 w-12 items-center justify-center rounded-full ${item.bgClass}`}>
              <Icon as={item.icon} size={24} className={item.iconClass} />
            </View>
            <Text className="mt-2.5 text-xs font-medium text-foreground">{item.label}</Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

function SectionTitle({ label, delay }: { label: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(280)}>
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
    </Animated.View>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation('navigation');
  const { data: visions, isLoading } = useVisions();
  const hasVision = !isLoading && visions && visions.length > 0;

  const GOALS_ITEMS_T: HubItem[] = [
    {
      icon: Target,
      label: t('hub.primeRoadmap'),
      route: '/(app)/(tabs)/goals/roadmap',
      iconClass: 'text-warning',
      bgClass: 'bg-warning/15',
    },
    {
      icon: BookOpen,
      label: t('reading'),
      route: '/(app)/(tabs)/goals/reading',
      iconClass: 'text-info',
      bgClass: 'bg-info/15',
    },
  ];

  const PRODUCTIVITY_ITEMS_T: HubItem[] = [
    {
      icon: FileText,
      label: t('notes'),
      route: '/(app)/notes',
      iconClass: 'text-success',
      bgClass: 'bg-success/15',
    },
    {
      icon: Bot,
      label: t('aiChat'),
      route: '/(app)/ai',
      iconClass: 'text-primary',
      bgClass: 'bg-primary/15',
    },
    {
      icon: Calendar,
      label: t('calendar'),
      route: '/(app)/calendar',
      iconClass: 'text-destructive',
      bgClass: 'bg-destructive/15',
    },
    {
      icon: Timer,
      label: t('pomodoro'),
      route: '/(app)/pomodoro',
      iconClass: 'text-warning',
      bgClass: 'bg-warning/15',
    },
  ];

  const ACCOUNT_ITEMS_T: HubItem[] = [
    {
      icon: User,
      label: t('profile'),
      route: '/(app)/profile',
      iconClass: 'text-foreground',
      bgClass: 'bg-muted',
    },
    {
      icon: Settings,
      label: t('settings'),
      route: '/(app)/settings',
      iconClass: 'text-foreground',
      bgClass: 'bg-muted',
    },
    {
      icon: CreditCard,
      label: t('subscription'),
      route: '/(app)/subscription',
      iconClass: 'text-primary',
      bgClass: 'bg-primary/15',
    },
    {
      icon: Bell,
      label: t('notifications'),
      route: '/(app)/notifications',
      iconClass: 'text-foreground',
      bgClass: 'bg-muted',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-2 pt-3">
        <Text className="text-2xl font-bold text-foreground">{t('more')}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-8 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Goals & Growth ───────────────────────────────── */}
        <View>
          <SectionTitle label={t('hub.goalsAndGrowth')} delay={60} />

          {/* Alignment CTA */}
          <Animated.View entering={FadeInDown.delay(100).duration(280)} className="mb-3">
            {!hasVision ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(app)/alignment-setup' as any);
                }}
                className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 active:bg-primary/10"
              >
                <View className="h-1 bg-primary/50" />
                <View className="flex-row items-center gap-4 p-4">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                    <Icon as={Compass} size={24} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {t('hub.setUpVision')}
                    </Text>
                    <Text className="mt-0.5 text-sm leading-5 text-muted-foreground">
                      {t('hub.setUpVisionDescription')}
                    </Text>
                  </View>
                </View>
                <View className="mx-4 mb-4">
                  <View className="items-center rounded-xl bg-primary py-2.5">
                    <Text className="text-sm font-semibold text-primary-foreground">
                      {t('hub.startAlignment')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <View className="flex-row items-center gap-2 self-start rounded-xl bg-success/10 px-4 py-2">
                <Icon as={CheckCircle2} size={14} className="text-success" />
                <Text className="text-xs font-medium text-success">{t('hub.visionAligned')}</Text>
              </View>
            )}
          </Animated.View>

          <HubGrid items={GOALS_ITEMS_T} delay={150} />
        </View>

        {/* ── Productivity ─────────────────────────────────── */}
        <View>
          <SectionTitle label={t('hub.productivity')} delay={280} />
          <HubGrid items={PRODUCTIVITY_ITEMS_T} delay={320} />
        </View>

        {/* ── Account ──────────────────────────────────────── */}
        <View>
          <SectionTitle label={t('hub.account')} delay={460} />
          <HubGrid items={ACCOUNT_ITEMS_T} delay={500} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
