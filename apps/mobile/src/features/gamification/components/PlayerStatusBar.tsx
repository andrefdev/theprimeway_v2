import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { ProgressRing } from './ProgressRing';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAuthStore } from '@/shared/stores/authStore';
import { getInitials } from '@/shared/utils/format';
import { Zap, Flame, Trophy, Shield } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PlayerStatusBarProps {
  greeting: string;
}

export function PlayerStatusBar({ greeting }: PlayerStatusBarProps) {
  const user = useAuthStore((s) => s.user);
  const totalXp = useGamificationStore((s) => s.totalXp);
  const dailyXp = useGamificationStore((s) => s.dailyXp);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const level = useGamificationStore((s) => s.level);
  const levelName = useGamificationStore((s) => s.levelName);
  const rank = useGamificationStore((s) => s.rank);
  const xpInCurrentLevel = useGamificationStore((s) => s.xpInCurrentLevel);
  const xpToNextLevel = useGamificationStore((s) => s.xpToNextLevel);
  const initials = getInitials(user?.name || 'U');
  const levelProgress = xpToNextLevel > 0 ? xpInCurrentLevel / xpToNextLevel : 1;

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="gap-5">
      {/* Greeting row */}
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">{greeting}</Text>
          <Text className="text-sm text-muted-foreground">
            Level {level} {levelName} · {rank}-Rank
          </Text>
        </View>
      </View>

      {/* XP Hero Card */}
      <View className="items-center rounded-2xl border border-border bg-card px-6 py-5">
        {/* Level ring with avatar inside */}
        <View className="relative items-center justify-center" style={{ width: 100, height: 100 }}>
          <ProgressRing progress={levelProgress} size={100} strokeWidth={4} color="hsl(45, 93%, 47%)" />
          <View className="absolute h-[76px] w-[76px] items-center justify-center rounded-full bg-primary/15">
            <Text className="text-xl font-bold text-primary">{initials}</Text>
          </View>
        </View>

        {/* XP info */}
        <View className="mt-3 items-center gap-1">
          <View className="flex-row items-center gap-1.5">
            <Icon as={Zap} size={16} className="text-xp" />
            <Text className="text-lg font-extrabold text-foreground">{xpInCurrentLevel} / {xpToNextLevel} XP</Text>
          </View>
          <Text className="text-xs text-muted-foreground">to Level {level + 1}</Text>
        </View>

        {/* Stats row */}
        <View className="mt-4 flex-row gap-6">
          <View className="items-center gap-1">
            <Icon as={Zap} size={18} className="text-xp" />
            <Text className="text-base font-bold text-foreground">{dailyXp}</Text>
            <Text className="text-2xs text-muted-foreground">Today</Text>
          </View>
          <View className="h-10 w-px bg-border" />
          <View className="items-center gap-1">
            <Icon as={Trophy} size={18} className="text-level-gold" />
            <Text className="text-base font-bold text-foreground">Lv.{level}</Text>
            <Text className="text-2xs text-muted-foreground">{levelName}</Text>
          </View>
          <View className="h-10 w-px bg-border" />
          <View className="items-center gap-1">
            <Icon as={Shield} size={18} className="text-xp" />
            <Text className="text-base font-bold text-foreground">{rank}</Text>
            <Text className="text-2xs text-muted-foreground">Rank</Text>
          </View>
          <View className="h-10 w-px bg-border" />
          <View className="items-center gap-1">
            <Icon as={Flame} size={18} className="text-streak-fire" />
            <Text className="text-base font-bold text-foreground">{currentStreak}d</Text>
            <Text className="text-2xs text-muted-foreground">Streak</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
