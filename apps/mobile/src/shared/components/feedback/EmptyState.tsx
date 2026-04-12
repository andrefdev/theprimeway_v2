import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center px-8 py-12', className)}>
      {icon && <Icon as={icon} size={48} className="mb-4 text-muted-foreground" />}
      <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
      {description && (
        <Text className="mt-2 text-center text-sm text-muted-foreground">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onPress={onAction}>
          <Text className="text-sm font-medium text-primary-foreground">{actionLabel}</Text>
        </Button>
      )}
    </View>
  );
}
