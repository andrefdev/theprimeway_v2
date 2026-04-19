import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
    return () => unsub();
  }, []);

  if (online) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      className="absolute left-0 right-0 top-0 z-50"
    >
      <View className="flex-row items-center justify-center gap-2 bg-amber-500 px-3 py-1.5">
        <Icon as={WifiOff} size={12} className="text-white" />
        <Text className="text-xs font-medium text-white">Offline — changes will sync when online</Text>
      </View>
    </Animated.View>
  );
}
