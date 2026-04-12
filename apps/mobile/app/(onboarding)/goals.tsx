import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import {
  Wallet,
  Briefcase,
  Heart,
  Users,
  Brain,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';

type PillarGoal = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
  selectedBg: string;
};

const PILLAR_GOALS: PillarGoal[] = [
  {
    id: 'finances',
    labelKey: 'pillars.finances',
    descriptionKey: 'pillars.financesDescription',
    icon: Wallet,
    color: 'text-emerald-400',
    selectedBg: 'bg-emerald-400/15 border-emerald-400/40',
  },
  {
    id: 'career',
    labelKey: 'pillars.career',
    descriptionKey: 'pillars.careerDescription',
    icon: Briefcase,
    color: 'text-blue-400',
    selectedBg: 'bg-blue-400/15 border-blue-400/40',
  },
  {
    id: 'health',
    labelKey: 'pillars.health',
    descriptionKey: 'pillars.healthDescription',
    icon: Heart,
    color: 'text-rose-400',
    selectedBg: 'bg-rose-400/15 border-rose-400/40',
  },
  {
    id: 'relationships',
    labelKey: 'pillars.relationships',
    descriptionKey: 'pillars.relationshipsDescription',
    icon: Users,
    color: 'text-amber-400',
    selectedBg: 'bg-amber-400/15 border-amber-400/40',
  },
  {
    id: 'mindset',
    labelKey: 'pillars.mindset',
    descriptionKey: 'pillars.mindsetDescription',
    icon: Brain,
    color: 'text-violet-400',
    selectedBg: 'bg-violet-400/15 border-violet-400/40',
  },
  {
    id: 'lifestyle',
    labelKey: 'pillars.lifestyle',
    descriptionKey: 'pillars.lifestyleDescription',
    icon: Sparkles,
    color: 'text-cyan-400',
    selectedBg: 'bg-cyan-400/15 border-cyan-400/40',
  },
];

const TOTAL_STEPS = 5;
const CURRENT_STEP = 1;

export default function GoalsScreen() {
  const { t } = useTranslation('features.onboarding.goalsSetup');
  const { t: tOnboarding } = useTranslation('features.onboarding');
  const [selected, setSelected] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState(true);

  const toggleGoal = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Back button */}
      <View className="px-6 pb-2 pt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <Icon as={ChevronLeft} size={20} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.back')}</Text>
          </Button>
          <Text className="text-sm font-medium text-muted-foreground">
            {t('step')}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mb-4 h-1.5 w-full rounded-full bg-muted">
          <View
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }}
          />
        </View>

        <Text className="text-3xl font-bold text-foreground">
          {t('title')}
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          {t('description')}
        </Text>
      </View>

      {/* Tooltip / Coach mark */}
      {showTooltip && (
        <Pressable
          onPress={() => setShowTooltip(false)}
          className="mx-6 mb-2 flex-row items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
        >
          <Icon as={Info} size={18} className="mt-0.5 text-primary" />
          <Text className="flex-1 text-sm leading-5 text-foreground/80">
            {tOnboarding('tooltips.goals')}
          </Text>
        </Pressable>
      )}

      {/* Goals Grid */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-3 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {PILLAR_GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              onPress={() => toggleGoal(goal.id)}
              className={cn(
                'flex-row items-center gap-4 rounded-2xl border border-border p-4',
                isSelected && goal.selectedBg
              )}
            >
              <View
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-xl',
                  isSelected ? 'bg-transparent' : 'bg-muted'
                )}
              >
                <Icon as={goal.icon} size={24} className={goal.color} />
              </View>

              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {t(goal.labelKey)}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {t(goal.descriptionKey)}
                </Text>
              </View>

              {isSelected && (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <Icon as={Check} size={16} className="text-primary-foreground" />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom Actions */}
      <View className="flex-row items-center justify-between border-t border-border px-6 pb-6 pt-4">
        <Button
          variant="ghost"
          onPress={() => router.push('/(onboarding)/habits')}
        >
          <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.skip')}</Text>
        </Button>

        <Button
          size="lg"
          onPress={() => router.push('/(onboarding)/habits')}
          disabled={selected.length === 0}
          className="min-w-[140px]"
        >
          <Text className="text-base font-semibold text-primary-foreground">
            {tOnboarding('buttons.next')}
          </Text>
          <Icon as={ChevronRight} size={20} className="text-primary-foreground" />
        </Button>
      </View>
    </SafeAreaView>
  );
}
