import { useEffect } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { useGamificationStore } from '../stores/gamificationStore';
import { Flame, Zap, Trophy, Star } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function LevelUpCelebration({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );

    // Auto dismiss after 2.5s
    const timeout = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timeout);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onDismiss} className="absolute inset-0 z-50">
      <Animated.View style={bgStyle} className="absolute inset-0 items-center justify-center bg-black/60">
        <Animated.View style={iconStyle} className="items-center gap-4 rounded-3xl bg-card px-10 py-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-level-gold/20">
            <Icon as={Trophy} size={40} className="text-level-gold" />
          </View>
          <Text className="text-xl font-extrabold text-foreground">Level Up!</Text>
          <Text className="text-base font-semibold text-level-gold">{message}</Text>
          <View className="flex-row items-center gap-1 rounded-full bg-xp/15 px-3 py-1">
            <Icon as={Star} size={14} className="text-xp" />
            <Text className="text-xs font-bold text-xp">Keep going!</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function StreakCelebration({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 250 }),
      withSpring(1, { damping: 10 })
    );
    const timeout = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onDismiss} className="absolute inset-0 z-50">
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} className="absolute inset-0 items-center justify-center bg-black/40">
        <Animated.View style={iconStyle} className="items-center gap-3 rounded-3xl bg-card px-8 py-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-streak-fire/20">
            <Icon as={Flame} size={36} className="text-streak-fire" />
          </View>
          <Text className="text-lg font-extrabold text-foreground">{message}</Text>
          <Text className="text-sm text-muted-foreground">Amazing consistency!</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function CelebrationOverlay() {
  const { showCelebration, pendingCelebration, dismissCelebration } = useGamificationStore();

  if (!showCelebration || !pendingCelebration) return null;

  if (pendingCelebration.type === 'levelUp') {
    return (
      <LevelUpCelebration
        message={pendingCelebration.message || 'New Level!'}
        onDismiss={dismissCelebration}
      />
    );
  }

  if (pendingCelebration.type === 'streak') {
    return (
      <StreakCelebration
        message={pendingCelebration.message || 'Streak!'}
        onDismiss={dismissCelebration}
      />
    );
  }

  return null;
}
