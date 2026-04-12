import { cn } from '@/shared/utils';
import { View } from 'react-native';
import { Text } from '@ui/text';

type Priority = 'high' | 'medium' | 'low';

const colorMap: Record<Priority, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

const labelColorMap: Record<Priority, string> = {
  high: 'text-priority-high',
  medium: 'text-priority-medium',
  low: 'text-priority-low',
};

interface PriorityDotProps {
  priority: Priority;
  size?: 'sm' | 'md';
  className?: string;
}

export function PriorityDot({ priority, size = 'sm', className }: PriorityDotProps) {
  const sizeClass = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return <View className={cn('rounded-full', colorMap[priority], sizeClass, className)} />;
}

interface PriorityBarProps {
  priority: Priority;
  className?: string;
}

export function PriorityBar({ priority, className }: PriorityBarProps) {
  return <View className={cn('w-1 rounded-full', colorMap[priority], className)} />;
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const labels: Record<Priority, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-full px-2 py-0.5',
        `${colorMap[priority]}/15`,
        className
      )}
    >
      <PriorityDot priority={priority} />
      <Text className={cn('text-2xs font-medium', labelColorMap[priority])}>
        {labels[priority]}
      </Text>
    </View>
  );
}
