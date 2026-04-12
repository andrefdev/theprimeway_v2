import { cn } from '@/shared/utils';
import { Pressable, View } from 'react-native';
import { Text } from '@ui/text';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({ title, actionLabel, onAction, className }: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="active:opacity-70">
          <Text className="text-sm font-medium text-primary">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
