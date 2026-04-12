import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, iconColor, className }: StatsCardProps) {
  return (
    <View className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground">{title}</Text>
        {icon && <Icon as={icon} size={16} className={iconColor || 'text-muted-foreground'} />}
      </View>
      <Text className="mt-1 text-2xl font-bold text-card-foreground">{String(value)}</Text>
      {subtitle && <Text className="mt-0.5 text-xs text-muted-foreground">{subtitle}</Text>}
    </View>
  );
}
