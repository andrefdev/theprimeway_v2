import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/utils/cn';
import { getLevelForXp } from '../model/constants';

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ xp, size = 'sm', className }: LevelBadgeProps) {
  const level = getLevelForXp(xp);

  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  }[size];

  const textClasses = {
    sm: 'text-2xs',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];

  return (
    <View className={cn('flex-row items-center gap-1 rounded-full bg-level-gold/20', sizeClasses, className)}>
      <Text className={cn('font-extrabold text-level-gold', textClasses)}>
        Lv.{level.level}
      </Text>
      <Text className={cn('font-semibold text-level-gold/80', textClasses)}>
        {level.name}
      </Text>
    </View>
  );
}
