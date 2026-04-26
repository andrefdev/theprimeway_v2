import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { ChevronRight, Calendar } from 'lucide-react-native';
import { View } from 'react-native';
import { PressableCard } from '@/shared/components/ui/pressable-card';
import { router } from 'expo-router';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { AnnualGoal } from '@shared/types/models';

interface AnnualGoalItemProps {
  goal: AnnualGoal;
  color?: string;
  className?: string;
}

export function AnnualGoalItem({ goal, color = '#3b82f6', className }: AnnualGoalItemProps) {
  const { locale } = useTranslation();
  const handlePress = () => {
    router.push(`/(app)/(tabs)/goals/annual/${goal.id}` as any);
  };

  const formattedDate = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString(locale, {
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <PressableCard
      onPress={handlePress}
      className={cn('flex-row items-center rounded-xl', className)}
    >
      {/* Color Indicator */}
      <View className="mr-3 h-10 w-1 rounded-full" style={{ backgroundColor: color }} />

      {/* Content */}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-card-foreground" numberOfLines={1}>
          {goal.title}
        </Text>

        {/* Progress + Date Row */}
        <View className="mt-2 flex-row items-center gap-3">
          {/* Progress Bar */}
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full"
              style={{
                backgroundColor: color,
                width: `${goal.progress ?? 0}%`,
              }}
            />
          </View>
          <Text className="text-xs font-medium text-muted-foreground">
            {goal.progress ?? 0}%
          </Text>
        </View>

        {/* Target Date */}
        {formattedDate && (
          <View className="mt-1.5 flex-row items-center gap-1">
            <Icon as={Calendar} size={12} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">{formattedDate}</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Icon as={ChevronRight} size={16} className="ml-2 text-muted-foreground" />
    </PressableCard>
  );
}
