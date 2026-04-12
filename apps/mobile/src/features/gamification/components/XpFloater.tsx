import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';
import { Icon } from '@/shared/components/ui/icon';

interface XpFloaterProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

export function XpFloater({ amount, visible, onComplete }: XpFloaterProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible && amount > 0) {
      opacity.value = 0;
      translateY.value = 0;
      scale.value = 0.5;

      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(400, withTiming(0, { duration: 300 }))
      );
      translateY.value = withTiming(-40, { duration: 850 });
      scale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 150 }),
        withDelay(300, withTiming(0.8, { duration: 200 }, () => {
          if (onComplete) runOnJS(onComplete)();
        }))
      );
    }
  }, [visible, amount]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!visible || amount <= 0) return null;

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute -top-2 right-0 z-50 flex-row items-center gap-0.5 rounded-full bg-xp px-2 py-0.5"
      pointerEvents="none"
    >
      <Icon as={Zap} size={10} className="text-white" />
      <Text className="text-xs font-bold text-white">+{amount}</Text>
    </Animated.View>
  );
}
