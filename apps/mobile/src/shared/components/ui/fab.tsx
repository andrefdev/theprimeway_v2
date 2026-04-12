import { cn } from '@/shared/utils';
import { Pressable, type PressableProps } from 'react-native';
import { Icon } from '@ui/icon';
import { Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface FABProps extends Omit<PressableProps, 'children'> {
  icon?: LucideIcon;
  size?: 'default' | 'sm';
  className?: string;
}

export function FAB({ icon = Plus, size = 'default', className, ...props }: FABProps) {
  const sizeClasses = size === 'sm' ? 'h-12 w-12' : 'h-14 w-14';
  const iconSize = size === 'sm' ? 20 : 24;

  return (
    <Pressable
      className={cn(
        'absolute bottom-6 right-4 z-50 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:bg-primary-hover',
        sizeClasses,
        className
      )}
      {...props}
    >
      <Icon as={icon} size={iconSize} className="text-primary-foreground" />
    </Pressable>
  );
}
