import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Header } from '@/shared/components/layout/Header';
import { Flame, Trophy, Target, Lock, Zap, Award, Star, Crown, Medal } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStreak, useAchievements, useDailyChallenges } from '@/features/gamification/hooks/useGamificationQueries';
import { useGamificationStore } from '@/features/gamification/stores/gamificationStore';
import { cn } from '@/shared/utils/cn';

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  trophy: Trophy,
  target: Target,
  zap: Zap,
  award: Award,
  star: Star,
  crown: Crown,
  medal: Medal,
};

const RARITY_COLOR: Record<string, string> = {
  common: 'text-slate-400',
  rare: 'text-sky-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

export default function AchievementsScreen() {
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const longestStreak = useGamificationStore((s) => s.longestStreak);
  const achievementsCount = useGamificationStore((s) => s.achievementsCount);

  const streakQuery = useStreak();
  const achievementsQuery = useAchievements();
  const challengesQuery = useDailyChallenges();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Achievements" showBack />

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8">
        <Animated.View entering={FadeInDown.duration(300)} className="mt-4 flex-row gap-3">
          <StatCard icon={Flame} label="Current" value={`${currentStreak}d`} colorClass="text-streak-fire" />
          <StatCard icon={Trophy} label="Best" value={`${longestStreak}d`} colorClass="text-level-gold" />
          <StatCard icon={Award} label="Unlocked" value={String(achievementsCount)} colorClass="text-primary" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="mt-6">
          <SectionTitle title="Activity" />
          <Card>
            <CardContent>
              <StreakHeatmap days={streakQuery.data?.heatmap ?? []} />
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-6">
          <SectionTitle title="Daily Challenges" />
          {challengesQuery.data?.data.length ? (
            <View className="gap-2">
              {challengesQuery.data.data.map((c) => {
                const pct = c.targetValue > 0 ? Math.min(1, c.currentValue / c.targetValue) : 0;
                return (
                  <Card key={c.id}>
                    <CardContent className="gap-2">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-foreground">{c.title}</Text>
                          <Text className="text-xs text-muted-foreground">{c.description}</Text>
                        </View>
                        <View className="flex-row items-center gap-1 rounded-full bg-xp/15 px-2 py-0.5">
                          <Icon as={Zap} size={10} className="text-xp" />
                          <Text className="text-2xs font-bold text-xp">+{c.xpReward}</Text>
                        </View>
                      </View>
                      <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <View
                          className={cn('h-full rounded-full', c.isCompleted ? 'bg-emerald-500' : 'bg-primary')}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </View>
                      <Text className="text-2xs text-muted-foreground">
                        {c.currentValue}/{c.targetValue} {c.isCompleted ? '✓ Done' : ''}
                      </Text>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          ) : (
            <EmptyCard label="No challenges today" />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(300)} className="mt-6">
          <SectionTitle title="Badges" />
          {achievementsQuery.data?.data.length ? (
            <View className="flex-row flex-wrap gap-3">
              {achievementsQuery.data.data.map((a) => {
                const IconComp = ICON_MAP[a.iconName?.toLowerCase()] ?? Medal;
                const rarityClass = RARITY_COLOR[a.rarity?.toLowerCase()] ?? 'text-slate-400';
                return (
                  <View
                    key={a.id}
                    className={cn(
                      'w-[31%] items-center rounded-xl border p-3',
                      a.unlocked ? 'border-border bg-card' : 'border-dashed border-border/60 bg-muted/40'
                    )}
                  >
                    <View
                      className={cn(
                        'h-10 w-10 items-center justify-center rounded-full',
                        a.unlocked ? 'bg-primary/15' : 'bg-muted'
                      )}
                    >
                      <Icon
                        as={a.unlocked ? IconComp : Lock}
                        size={18}
                        className={a.unlocked ? rarityClass : 'text-muted-foreground'}
                      />
                    </View>
                    <Text className="mt-2 text-center text-2xs font-semibold text-foreground" numberOfLines={2}>
                      {a.title}
                    </Text>
                    <Text className={cn('mt-0.5 text-2xs', rarityClass)}>{a.rarity}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyCard label="No achievements yet" />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </Text>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
      <Icon as={icon} size={18} className={colorClass} />
      <Text className="mt-1 text-lg font-bold text-foreground">{value}</Text>
      <Text className="text-2xs text-muted-foreground">{label}</Text>
    </View>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <Card>
      <CardContent>
        <Text className="text-center text-xs text-muted-foreground">{label}</Text>
      </CardContent>
    </Card>
  );
}

function StreakHeatmap({ days }: { days: Array<{ date: string; totalXp: number; goalMet: boolean }> }) {
  const grid = useMemo(() => {
    const today = startOfDay(new Date());
    const weeks = 13;
    const total = weeks * 7;
    const map = new Map<string, { xp: number; met: boolean }>();
    for (const d of days) {
      map.set(format(startOfDay(new Date(d.date)), 'yyyy-MM-dd'), { xp: d.totalXp, met: d.goalMet });
    }
    const cells: Array<{ key: string; xp: number; met: boolean }> = [];
    for (let i = total - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      const entry = map.get(key);
      cells.push({ key, xp: entry?.xp ?? 0, met: entry?.met ?? false });
    }
    const cols: typeof cells[] = [];
    for (let w = 0; w < weeks; w++) cols.push(cells.slice(w * 7, w * 7 + 7));
    return cols;
  }, [days]);

  return (
    <View className="gap-2">
      <View className="flex-row gap-[2px]">
        {grid.map((col, ci) => (
          <View key={ci} className="gap-[2px]">
            {col.map((cell) => {
              const bg = cell.met
                ? 'rgba(16, 185, 129, 0.9)'
                : cell.xp > 0
                  ? 'rgba(16, 185, 129, 0.35)'
                  : 'rgba(148, 163, 184, 0.12)';
              return (
                <View
                  key={cell.key}
                  style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: bg }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-2xs text-muted-foreground">Last 13 weeks</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-2xs text-muted-foreground">Less</Text>
          {[0.12, 0.35, 0.6, 0.9].map((a) => (
            <View
              key={a}
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                backgroundColor: `rgba(16, 185, 129, ${a})`,
              }}
            />
          ))}
          <Text className="text-2xs text-muted-foreground">More</Text>
        </View>
      </View>
    </View>
  );
}
