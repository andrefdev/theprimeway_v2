import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/shared/components/ui/text';
import { IconCircle } from '@/shared/components/ui/icon-circle';
import { Timer, CheckSquare, Flame } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePomodoroStats } from '../hooks/usePomodoro';

export function PomodoroStats() {
  const { t } = useTranslation('features.pomodoro');
  const { data: stats, isLoading } = usePomodoroStats();

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(300)} className="flex-row gap-3">
      <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
        <IconCircle icon={Timer} color="primary" size="sm" />
        <Text className="mt-2 text-lg font-bold text-foreground">
          {isLoading
            ? '–'
            : stats?.todayMinutes != null
              ? `${Math.floor(stats.todayMinutes / 60)}h`
              : '0h'}
        </Text>
        <Text className="text-2xs text-muted-foreground">{t('statistics.todayFocus')}</Text>
      </View>
      <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
        <IconCircle icon={CheckSquare} color="success" size="sm" />
        <Text className="mt-2 text-lg font-bold text-foreground">
          {isLoading ? '–' : (stats?.todaySessions ?? 0)}
        </Text>
        <Text className="text-2xs text-muted-foreground">{t('statistics.sessions')}</Text>
      </View>
      <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
        <IconCircle icon={Flame} color="warning" size="sm" />
        <Text className="mt-2 text-lg font-bold text-foreground">
          {isLoading
            ? '–'
            : stats?.currentStreak != null
              ? `${stats.currentStreak}d`
              : '0d'}
        </Text>
        <Text className="text-2xs text-muted-foreground">Streak</Text>
      </View>
    </Animated.View>
  );
}
