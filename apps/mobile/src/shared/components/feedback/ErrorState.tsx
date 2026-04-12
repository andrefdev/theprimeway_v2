import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { AlertTriangle } from 'lucide-react-native';
import { View } from 'react-native';
import { i18n } from '@/i18n';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = i18n.t('common.status.error'),
  message,
  onRetry,
  retryLabel = i18n.t('common.actions.retry'),
  className,
}: ErrorStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center px-8 py-12', className)}>
      <Icon as={AlertTriangle} size={48} className="mb-4 text-destructive" />
      <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
      {message && (
        <Text className="mt-2 text-center text-sm text-muted-foreground">{message}</Text>
      )}
      {onRetry && (
        <Button variant="outline" className="mt-6" onPress={onRetry}>
          <Text className="text-sm font-medium">{retryLabel}</Text>
        </Button>
      )}
    </View>
  );
}
