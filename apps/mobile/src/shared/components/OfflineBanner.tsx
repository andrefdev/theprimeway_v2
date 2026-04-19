import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline, pendingMutations } = useNetworkStatus();

  if (isOnline && pendingMutations === 0) return null;

  const offline = !isOnline;
  const label = offline
    ? pendingMutations > 0
      ? `Offline — ${pendingMutations} change${pendingMutations > 1 ? 's' : ''} queued`
      : 'Offline — showing cached data'
    : `Syncing ${pendingMutations} change${pendingMutations > 1 ? 's' : ''}…`;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      className="px-4 py-1.5"
    >
      <View
        className={
          offline
            ? 'flex-row items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-2'
            : 'flex-row items-center gap-2 rounded-lg bg-primary/15 px-3 py-2'
        }
      >
        <Icon
          as={offline ? CloudOff : RefreshCw}
          size={14}
          className={offline ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}
        />
        <Text
          className={
            offline
              ? 'flex-1 text-xs font-medium text-amber-700 dark:text-amber-300'
              : 'flex-1 text-xs font-medium text-primary'
          }
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}
