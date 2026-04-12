import { cn } from '@/shared/utils/cn';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  avoidKeyboard?: boolean;
}

export function Screen({
  children,
  className,
  edges = ['top', 'bottom'],
  avoidKeyboard = true,
}: ScreenProps) {
  const content = (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-background', className)}>
      {children}
    </SafeAreaView>
  );

  if (!avoidKeyboard) return content;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

interface ScreenContentProps {
  children: ReactNode;
  className?: string;
}

export function ScreenContent({ children, className }: ScreenContentProps) {
  return <View className={cn('flex-1 px-4', className)}>{children}</View>;
}
