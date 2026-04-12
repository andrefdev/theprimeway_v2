import { cn } from '@/shared/utils';
import { View } from 'react-native';
import { Icon } from '@ui/icon';
import type { LucideIcon } from 'lucide-react-native';

type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted';

const bgMap: Record<ColorVariant, string> = {
  primary: 'bg-primary/15',
  secondary: 'bg-secondary/15',
  accent: 'bg-accent/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  destructive: 'bg-destructive/15',
  info: 'bg-info/15',
  muted: 'bg-muted',
};

const iconColorMap: Record<ColorVariant, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
  muted: 'text-muted-foreground',
};

interface IconCircleProps {
  icon: LucideIcon;
  color?: ColorVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconCircle({ icon, color = 'primary', size = 'md', className }: IconCircleProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];

  const iconSize = { sm: 16, md: 20, lg: 24 }[size];

  return (
    <View className={cn('items-center justify-center rounded-full', bgMap[color], sizeClasses, className)}>
      <Icon as={icon} size={iconSize} className={iconColorMap[color]} />
    </View>
  );
}
