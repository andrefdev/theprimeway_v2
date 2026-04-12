import { Pressable, View, ActivityIndicator } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  isLoading?: boolean;
  className?: string;
}

const PROVIDER_CONFIG = {
  google: { icon: 'G', label: 'continueWithGoogle' },
  apple: { icon: '\uF8FF', label: 'continueWithApple' },
} as const;

export function SocialButton({ provider, onPress, isLoading, className }: SocialButtonProps) {
  const { t } = useTranslation('auth.oauth');
  const config = PROVIDER_CONFIG[provider];

  return (
    <Pressable
      className={cn(
        'h-11 flex-row items-center justify-center gap-3 rounded-md border border-border bg-background active:bg-muted',
        className
      )}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View className="flex-row items-center gap-3">
          <Text className="text-lg">{config.icon}</Text>
          <Text className="text-sm font-medium text-foreground">{t(config.label)}</Text>
        </View>
      )}
    </Pressable>
  );
}
