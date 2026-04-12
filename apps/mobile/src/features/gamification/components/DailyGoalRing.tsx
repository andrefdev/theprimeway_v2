import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { Zap, Check } from 'lucide-react-native';
import { ProgressRing } from './ProgressRing';
import { useGamificationStore } from '../stores/gamificationStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

function WeekGoalDots() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View className="flex-row items-center gap-3">
      {days.map((day, i) => (
        <View key={i} className="items-center gap-1">
          <Text className="text-[9px] font-medium text-muted-foreground">{day}</Text>
          <View
            className={cn(
              'h-3 w-3 rounded-full',
              i === 6 ? 'border-2 border-xp bg-xp/30' : 'bg-muted'
            )}
          />
        </View>
      ))}
    </View>
  );
}

export function DailyGoalRing() {
  const dailyXp = useGamificationStore((s) => s.dailyXp);
  const dailyGoal = useGamificationStore((s) => s.dailyGoal);
  const progress = dailyGoal > 0 ? dailyXp / dailyGoal : 0;
  const isComplete = progress >= 1;
  const percentText = Math.min(Math.round(progress * 100), 100);

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <View className="items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5">
        {/* Big ring centered */}
        <View className="relative items-center justify-center" style={{ width: 88, height: 88 }}>
          <ProgressRing progress={progress} size={88} strokeWidth={6} />
          <View className="absolute items-center">
            {isComplete ? (
              <Icon as={Check} size={28} className="text-xp" />
            ) : (
              <Text className="text-xl font-extrabold text-foreground">{percentText}%</Text>
            )}
          </View>
        </View>

        {/* Text */}
        <View className="items-center gap-1">
          <Text className="text-base font-bold text-foreground">
            {isComplete ? 'Daily Goal Complete!' : 'Daily Goal'}
          </Text>
          <View className="flex-row items-center gap-1">
            <Icon as={Zap} size={14} className="text-xp" />
            <Text className="text-sm text-muted-foreground">
              {dailyXp} / {dailyGoal} XP
            </Text>
          </View>
        </View>

        {/* Week dots */}
        <WeekGoalDots />
      </View>
    </Animated.View>
  );
}
