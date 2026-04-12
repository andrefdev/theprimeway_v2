import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { PILLAR_MAP } from '@/shared/constants/pillars';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  Wallet,
  Briefcase,
  Heart,
  Users,
  Brain,
  Sparkles,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { PillarArea, ThreeYearGoal } from '@shared/types/models';

const PILLAR_ICONS: Record<PillarArea, LucideIcon> = {
  finances: Wallet,
  career: Briefcase,
  health: Heart,
  relationships: Users,
  mindset: Brain,
  lifestyle: Sparkles,
};

interface ThreeYearGoalCardProps {
  threeYearGoal: ThreeYearGoal;
  className?: string;
}

export function ThreeYearGoalCard({ threeYearGoal, className }: ThreeYearGoalCardProps) {
  const { t } = useTranslation('features.goals');
  const config = PILLAR_MAP[threeYearGoal.area];
  const PillarIcon = PILLAR_ICONS[threeYearGoal.area];
  const annualGoalCount = threeYearGoal.annualGoals?.length ?? 0;

  const averageProgress =
    annualGoalCount > 0
      ? Math.round(
          threeYearGoal.annualGoals.reduce((sum, o) => sum + (o.progress ?? 0), 0) / annualGoalCount
        )
      : 0;

  const handlePress = () => {
    router.push(`/(app)/(tabs)/goals/three-year/${threeYearGoal.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        'rounded-xl border border-border bg-card p-4 active:opacity-80',
        className
      )}
    >
      {/* Icon + Area Name */}
      <View className="mb-3 flex-row items-center gap-2">
        <View
          className="h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon as={PillarIcon} size={18} color={config.color} />
        </View>
        <Text className="flex-1 text-sm font-semibold text-card-foreground" numberOfLines={1}>
          {threeYearGoal.title || t(`areas.${threeYearGoal.area}`)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full"
          style={{
            backgroundColor: config.color,
            width: `${averageProgress}%`,
          }}
        />
      </View>

      {/* Stats Row */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground">
          {averageProgress}% {t('status.completed')}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {annualGoalCount} {t('annualGoal.title')}
        </Text>
      </View>
    </Pressable>
  );
}
