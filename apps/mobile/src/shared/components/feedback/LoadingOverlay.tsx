import { cn } from '@/shared/utils/cn';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({ message, fullScreen = false, className }: LoadingOverlayProps) {
  return (
    <View
      className={cn(
        'items-center justify-center',
        fullScreen && 'absolute inset-0 z-50 bg-background/80',
        !fullScreen && 'flex-1 py-12',
        className
      )}
    >
      <ActivityIndicator size="large" className="text-primary" />
      {message && <Text className="mt-3 text-sm text-muted-foreground">{message}</Text>}
    </View>
  );
}
