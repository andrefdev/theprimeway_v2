import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { Check, Clock, Tag, Play } from 'lucide-react-native';
import { XpFloater } from '@/features/gamification/components/XpFloater';
import { XP_VALUES } from '@/features/gamification/model/constants';
import { useGamificationStore } from '@/features/gamification/stores/gamificationStore';
import * as Haptics from 'expo-haptics';
import type { Task, TaskPriority } from '@shared/types/models';

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

const PRIORITY_CHECK_BORDER: Record<TaskPriority, string> = {
  high: 'border-priority-high',
  medium: 'border-priority-medium',
  low: 'border-priority-low',
};

const PRIORITY_CHECK_BG: Record<TaskPriority, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

interface TaskCardProps {
  task: Task;
  onToggleComplete?: (task: Task) => void;
  onPress?: (task: Task) => void;
  onTimer?: (task: Task) => void;
  showTimeSlot?: boolean;
}

export function TaskCard({ task, onToggleComplete, onPress, onTimer, showTimeSlot }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const [showXp, setShowXp] = useState(false);
  const addXp = useGamificationStore((s) => s.addXp);
  const awardXpToBackend = useGamificationStore((s) => s.awardXpToBackend);
  const checkScale = useSharedValue(1);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleToggle = useCallback(() => {
    if (!isCompleted) {
      checkScale.value = withSequence(
        withTiming(0.8, { duration: 80 }),
        withSpring(1.2, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 10 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const xpAmount = XP_VALUES.task[task.priority];
      addXp({ type: 'task', amount: xpAmount });
      setShowXp(true);
      // Sync with backend (fire & forget)
      const today = new Date().toISOString().split('T')[0];
      awardXpToBackend({
        source: 'task',
        sourceId: task.id,
        amount: xpAmount,
        earnedDate: today,
        metadata: { priority: task.priority, title: task.title },
      });
    }
    onToggleComplete?.(task);
  }, [task, onToggleComplete, isCompleted, addXp]);

  const handlePress = useCallback(() => onPress?.(task), [task, onPress]);
  const handleTimer = useCallback(() => onTimer?.(task), [task, onTimer]);

  const xpAmount = XP_VALUES.task[task.priority];

  const formattedDuration =
    task.estimatedDurationMinutes != null
      ? task.estimatedDurationMinutes >= 60
        ? `${Math.floor(task.estimatedDurationMinutes / 60)}h${task.estimatedDurationMinutes % 60 ? ` ${task.estimatedDurationMinutes % 60}m` : ''}`
        : `${task.estimatedDurationMinutes}m`
      : null;

  const timeSlot = showTimeSlot && task.scheduledStart
    ? new Date(task.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const tags = Array.isArray(task.tags) ? task.tags : [];

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Pressable
        onPress={handlePress}
        className={cn(
          'flex-row items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4',
          isCompleted && 'opacity-50'
        )}
      >
        {/* Checkbox — colored by priority, bigger */}
        <View className="relative">
          <XpFloater amount={xpAmount} visible={showXp} onComplete={() => setShowXp(false)} />
          <Animated.View style={checkAnimStyle}>
            <Pressable
              onPress={handleToggle}
              className={cn(
                'h-8 w-8 items-center justify-center rounded-full border-2',
                isCompleted
                  ? cn('border-transparent', PRIORITY_CHECK_BG[task.priority])
                  : PRIORITY_CHECK_BORDER[task.priority]
              )}
              hitSlop={8}
            >
              {isCompleted && <Icon as={Check} size={16} className="text-white" />}
            </Pressable>
          </Animated.View>
        </View>

        {/* Content */}
        <View className="flex-1 gap-2">
          <Text
            className={cn(
              'text-base font-semibold text-foreground',
              isCompleted && 'text-muted-foreground line-through'
            )}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            {/* Priority pill */}
            <View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <View className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[task.priority])} />
              <Text className="text-2xs capitalize text-muted-foreground">{task.priority}</Text>
            </View>
            {timeSlot && (
              <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                <Icon as={Clock} size={10} className="text-primary" />
                <Text className="text-2xs font-medium text-primary">{timeSlot}</Text>
              </View>
            )}
            {formattedDuration && (
              <View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <Icon as={Clock} size={10} className="text-muted-foreground" />
                <Text className="text-2xs text-muted-foreground">{formattedDuration}</Text>
              </View>
            )}
            {tags.length > 0 && (
              <View className="flex-row items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5">
                <Icon as={Tag} size={10} className="text-accent" />
                <Text className="text-2xs text-accent" numberOfLines={1}>
                  {tags[0]}{tags.length > 1 ? ` +${tags.length - 1}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Timer button — bigger */}
        {!isCompleted && onTimer && (
          <Pressable
            onPress={handleTimer}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/10 active:bg-primary/20"
            hitSlop={4}
          >
            <Icon as={Play} size={16} className="text-primary" />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}
