import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { Flame, Check } from 'lucide-react-native';
import { XpFloater } from '@/features/gamification/components/XpFloater';
import { XP_VALUES } from '@/features/gamification/model/constants';
import { useGamificationStore } from '@/features/gamification/stores/gamificationStore';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { HabitWithLogs } from '../types';

interface HabitCardProps {
  habit: HabitWithLogs;
  currentStreak?: number;
  onComplete: () => void;
  onUncomplete?: () => void;
  onPress?: () => void;
  className?: string;
}

function getStreakBg(streak: number): string {
  if (streak >= 30) return 'bg-streak-legendary/15';
  if (streak >= 7) return 'bg-streak-fire/15';
  return 'bg-warning/15';
}

function getStreakText(streak: number): string {
  if (streak >= 30) return 'text-streak-legendary';
  if (streak >= 7) return 'text-streak-fire';
  return 'text-warning';
}

function AnimatedStreak({ streak }: { streak: number }) {
  const pulseScale = useSharedValue(1);

  if (streak >= 7) {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View className={cn('flex-row items-center gap-1 rounded-full px-2.5 py-1', getStreakBg(streak))}>
      <Animated.View style={iconStyle}>
        <Icon as={Flame} size={12} className={getStreakText(streak)} />
      </Animated.View>
      <Text className={cn('text-xs font-bold', getStreakText(streak))}>{streak}d</Text>
    </View>
  );
}

function WeekDots({ habit }: { habit: HabitWithLogs }) {
  const today = new Date();
  const dots = [];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const log = habit.logs?.find((l) => l.date?.split('T')[0] === dateStr);
    const completed = (log?.completedCount ?? 0) >= (habit.targetFrequency || 1);
    const isToday = i === 0;

    dots.push(
      <View key={dateStr} className="items-center gap-1">
        <Text className="text-[9px] font-medium text-muted-foreground">{dayLabels[6 - i]}</Text>
        <View
          className={cn(
            'h-3.5 w-3.5 items-center justify-center rounded-full',
            completed ? 'opacity-100' : 'opacity-20',
            isToday && !completed && 'border border-muted-foreground/40'
          )}
          style={{ backgroundColor: habit.color || '#6454FD' }}
        >
          {completed && <Icon as={Check} size={8} className="text-white" />}
        </View>
      </View>
    );
  }
  return <View className="flex-row items-center gap-2">{dots}</View>;
}

export function HabitCard({
  habit,
  currentStreak = 0,
  onComplete,
  onUncomplete,
  onPress,
  className,
}: HabitCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayLog = habit.logs?.find((log) => log.date?.split('T')[0] === today);
  const completedToday = todayLog?.completedCount ?? 0;
  const target = habit.targetFrequency || 1;
  const isCompleted = completedToday >= target;

  const [showXp, setShowXp] = useState(false);
  const addXp = useGamificationStore((s) => s.addXp);
  const awardXpToBackend = useGamificationStore((s) => s.awardXpToBackend);
  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleToggle = async () => {
    if (isCompleted) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUncomplete?.();
    } else {
      buttonScale.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withSpring(1.15, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 10 })
      );
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onComplete();
      addXp({ type: 'habit', amount: XP_VALUES.habit });
      setShowXp(true);
      // Sync with backend (fire & forget)
      awardXpToBackend({
        source: 'habit',
        sourceId: habit.id,
        amount: XP_VALUES.habit,
        earnedDate: today,
        metadata: { habitName: habit.name },
      });
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4',
        className
      )}
    >
      {/* Toggle button — bigger, uses habit color */}
      <View className="relative">
        <XpFloater amount={XP_VALUES.habit} visible={showXp} onComplete={() => setShowXp(false)} />
        <Animated.View style={buttonAnimStyle}>
          <Pressable
            onPress={handleToggle}
            className={cn(
              'h-12 w-12 items-center justify-center rounded-full border-2',
              isCompleted ? 'border-transparent' : 'border-muted-foreground/20'
            )}
            style={isCompleted ? { backgroundColor: habit.color || '#6454FD' } : undefined}
            hitSlop={8}
          >
            {isCompleted ? (
              <Icon as={Check} size={22} className="text-white" />
            ) : (
              <View
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: (habit.color || '#6454FD') + '30' }}
              />
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Content */}
      <View className="flex-1 gap-2.5">
        {/* Name + Streak */}
        <View className="flex-row items-center gap-2">
          <Text
            className={cn(
              'flex-1 text-base font-semibold text-foreground',
              isCompleted && 'text-muted-foreground'
            )}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
          {currentStreak > 0 && <AnimatedStreak streak={currentStreak} />}
        </View>

        {/* Week dots + Progress */}
        <View className="flex-row items-center justify-between">
          <WeekDots habit={habit} />
          {target > 1 && (
            <Text className="text-xs text-muted-foreground">
              {completedToday}/{target}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
