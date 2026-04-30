import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/shared/utils/cn';

interface Props {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ className, width, height }: Props) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width as any, height: height as any },
        animatedStyle,
      ]}
      className={cn('rounded-md bg-muted', className)}
    />
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="gap-2 rounded-xl border border-border bg-card p-4">
          <Skeleton height={14} className="w-3/4" />
          <Skeleton height={10} className="w-1/2" />
        </View>
      ))}
    </View>
  );
}
