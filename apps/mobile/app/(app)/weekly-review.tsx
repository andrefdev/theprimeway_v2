import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, startOfWeek, endOfWeek, subDays, addWeeks } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Icon } from '@/shared/components/ui/icon';
import { IconCircle } from '@/shared/components/ui/icon-circle';
import { CheckSquare, Flame, Target, Sparkles, ChevronLeft, Wand2 } from 'lucide-react-native';
import { useTasks } from '@features/tasks/hooks/useTasks';
import { useHabits, useHabitStats } from '@features/habits/hooks/useHabits';
import { useVisions } from '@features/goals/hooks/useGoals';
import { useWeeklyPlan } from '@features/ai/hooks/useWeeklyPlan';
import type { WeeklyPlanResponse } from '@features/ai/services/aiService';
import { router } from 'expo-router';

const DAYS: Array<keyof WeeklyPlanResponse['plan']> = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

function reflectionKey(weekStart: Date) {
  return `weekly_reflection_${format(weekStart, 'yyyy-MM-dd')}`;
}

export default function WeeklyReviewScreen() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addWeeks(weekStart, 1);

  const [reflection, setReflection] = useState('');
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);

  const { data: tasks } = useTasks({});
  const { data: habits } = useHabits();
  const { data: stats } = useHabitStats();
  const { data: visions } = useVisions();
  const weeklyPlan = useWeeklyPlan();

  useEffect(() => {
    AsyncStorage.getItem(reflectionKey(weekStart)).then((v) => {
      if (v != null) setReflection(v);
    });
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      AsyncStorage.setItem(reflectionKey(weekStart), reflection).catch(() => {});
    }, 400);
    return () => clearTimeout(handle);
  }, [reflection]);

  const weekTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    const cutoff = subDays(now, 7).getTime();
    return tasks.filter((t: any) => {
      const d = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      return d >= cutoff;
    });
  }, [tasks]);

  const completedCount = weekTasks.filter((t: any) => t.status === 'completed').length;
  const totalCount = weekTasks.length;
  const completionRate = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const habitAdherence = (() => {
    const s = stats as any;
    const total = s?.totalHabits ?? s?.total_habits ?? 0;
    const done = s?.totalCompletedToday ?? s?.total_completed_today ?? 0;
    return total ? Math.round((done / total) * 100) : 0;
  })();

  const activeHabits = Array.isArray(habits) ? habits.length : 0;
  const activeGoals = Array.isArray(visions) ? visions.length : 0;

  const handleGeneratePlan = async () => {
    const weekStartDate = format(nextWeekStart, 'yyyy-MM-dd');
    try {
      const result = await weeklyPlan.mutateAsync(weekStartDate);
      setPlan(result);
    } catch {
      // mutation error state shown below
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-card">
          <Icon as={ChevronLeft} size={20} className="text-foreground" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">Weekly Review</Text>
          <Text className="text-xs text-muted-foreground">{`${format(weekStart, 'MMM d')} — ${format(weekEnd, 'MMM d')}`}</Text>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(280)} className="mt-4">
          <Card>
            <CardContent className="flex-row items-center gap-3 py-4">
              <IconCircle icon={CheckSquare} color="primary" size="md" />
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground">Tasks</Text>
                <Text className="text-lg font-bold text-foreground">
                  {completedCount} / {totalCount} completed
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{completionRate}% completion rate</Text>
              </View>
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(280)} className="mt-3">
          <Card>
            <CardContent className="flex-row items-center gap-3 py-4">
              <IconCircle icon={Flame} color="success" size="md" />
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground">Habits</Text>
                <Text className="text-lg font-bold text-foreground">{activeHabits} active</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{habitAdherence}% adherence today</Text>
              </View>
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(280)} className="mt-3">
          <Card>
            <CardContent className="flex-row items-center gap-3 py-4">
              <IconCircle icon={Target} color="accent" size="md" />
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground">Goals</Text>
                <Text className="text-lg font-bold text-foreground">{activeGoals} active visions</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Review your roadmap for momentum</Text>
              </View>
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(280)} className="mt-6">
          <View className="mb-2 flex-row items-center gap-2">
            <Icon as={Sparkles} size={16} className="text-primary" />
            <Text className="text-sm font-semibold text-foreground">Reflection</Text>
          </View>
          <Text className="mb-2 text-xs text-muted-foreground">
            What went well? What will you change next week?
          </Text>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Write your reflection..."
            multiline
            textAlignVertical="top"
            className="min-h-[140px] rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground"
            placeholderTextColor="#94a3b8"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(280)} className="mt-6">
          <View className="mb-2 flex-row items-center gap-2">
            <Icon as={Wand2} size={16} className="text-primary" />
            <Text className="text-sm font-semibold text-foreground">AI Plan for Next Week</Text>
          </View>
          <Text className="mb-3 text-xs text-muted-foreground">
            {format(nextWeekStart, 'MMM d')} — {format(endOfWeek(nextWeekStart, { weekStartsOn: 1 }), 'MMM d')}
          </Text>

          {!plan && !weeklyPlan.isPending && (
            <Button size="lg" onPress={handleGeneratePlan}>
              <Icon as={Sparkles} size={16} className="text-primary-foreground" />
              <Text className="text-base font-semibold text-primary-foreground">Generate plan</Text>
            </Button>
          )}

          {weeklyPlan.isPending && (
            <View className="items-center gap-2 rounded-2xl border border-border bg-card px-4 py-6">
              <ActivityIndicator />
              <Text className="text-xs text-muted-foreground">Planning your week…</Text>
            </View>
          )}

          {weeklyPlan.isError && (
            <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <Text className="text-xs text-destructive">Could not generate plan. Try again.</Text>
            </View>
          )}

          {plan && (
            <View className="gap-3">
              {plan.rationale ? (
                <View className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <Text className="text-xs leading-5 text-foreground">{plan.rationale}</Text>
                </View>
              ) : null}
              {DAYS.map((day) => {
                const items = plan.plan[day] ?? [];
                return (
                  <View key={day} className="rounded-2xl border border-border bg-card px-4 py-3">
                    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {day}
                    </Text>
                    {items.length === 0 ? (
                      <Text className="text-xs italic text-muted-foreground">Rest / flex</Text>
                    ) : (
                      <View className="gap-1.5">
                        {items.map((it, i) => (
                          <View key={i} className="flex-row items-start gap-2">
                            <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                            <View className="flex-1">
                              <Text className="text-sm text-foreground">{it.title}</Text>
                              {it.timeBlock ? (
                                <Text className="text-2xs text-muted-foreground">{it.timeBlock}</Text>
                              ) : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
              <Button variant="outline" size="lg" onPress={handleGeneratePlan}>
                <Text className="text-sm font-medium text-foreground">Regenerate</Text>
              </Button>
            </View>
          )}
        </Animated.View>

        <View className="mt-6 gap-3">
          <Button variant="ghost" size="lg" onPress={() => router.push('/(app)/(tabs)/ai' as any)}>
            <Text className="text-base font-medium text-muted-foreground">Ask AI for more insights</Text>
          </Button>
          <Button variant="ghost" size="lg" onPress={() => router.back()}>
            <Text className="text-base font-medium text-muted-foreground">Done</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
