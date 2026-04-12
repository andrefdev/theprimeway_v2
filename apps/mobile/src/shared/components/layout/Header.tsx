import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  className,
}: HeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className={cn('flex-row items-center justify-between px-4 py-3', className)}>
      <View className="min-w-[40px] flex-row items-center">
        {showBack && (
          <Pressable onPress={handleBack} className="mr-2 p-1" hitSlop={8}>
            <Icon as={ChevronLeft} size={24} className="text-foreground" />
          </Pressable>
        )}
        {leftAction}
      </View>

      {title && (
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">{title}</Text>
      )}

      <View className="min-w-[40px] flex-row items-center justify-end">{rightAction}</View>
    </View>
  );
}
