import { View, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Icon } from '@/shared/components/ui/icon';
import { IconCircle } from '@/shared/components/ui/icon-circle';
import { SectionHeader } from '@/shared/components/ui/section-header';
import { TaskCard } from '@features/tasks/components/TaskCard';
import { TaskEditSheet } from '@features/tasks/components/TaskEditSheet';
import { TaskTimerSheet } from '@features/tasks/components/TaskTimerSheet';
import { TaskFormSheet } from '@features/tasks/components/TaskFormSheet';
import { HabitCard } from '@features/habits/components/HabitCard';
import { TransactionFormSheet } from '@features/finances/components/TransactionFormSheet';
import { PlayerStatusBar } from '@features/gamification/components/PlayerStatusBar';
import { DailyGoalRing } from '@features/gamification/components/DailyGoalRing';
import { useGamificationStore } from '@features/gamification/stores/gamificationStore';
import { useTasks, useUpdateTask } from '@features/tasks/hooks/useTasks';
import { useHabits, useHabitStats, useLogHabit } from '@features/habits/hooks/useHabits';
import { useAuthStore } from '@/shared/stores/authStore';
import { router } from 'expo-router';
import {
  CheckSquare, Flame, Timer, Plus, Wallet, FileText, Sparkles, Bell,
} from 'lucide-react-native';
import { useAggregatedNotifications } from '@features/notifications/hooks/useNotifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { Task } from '@shared/types/models';
import type { HabitWithLogs } from '@features/habits/types';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation('features.dashboard');
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Sheets state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timerTask, setTimerTask] = useState<Task | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: tasks } = useTasks({ date: todayStr });
  const { data: habits } = useHabits();
  const { data: habitStats } = useHabitStats();
  const updateTask = useUpdateTask();
  const logHabit = useLogHabit();
  const syncWithBackend = useGamificationStore((s) => s.syncWithBackend);
  const { data: notificationsData } = useAggregatedNotifications();
  const notificationCount = notificationsData?.count ?? 0;

  const todayTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.slice(0, 5);
  }, [tasks]);

  const todayHabits = useMemo(() => {
    if (!habits || !Array.isArray(habits)) return [];
    return habits.slice(0, 5);
  }, [habits]);

  const completedTasks = todayTasks.filter((t) => t.status === 'completed').length;
  const s = habitStats as any;
  const completedHabits = s?.totalCompletedToday ?? s?.total_completed_today ?? 0;
  const totalHabits = s?.totalHabits ?? s?.total_habits ?? 0;
  const bestStreak = (() => {
    const longestArr = s?.streaks?.longest ?? [];
    return longestArr[0]?.streakDays ?? longestArr[0]?.streak_days ?? 0;
  })();

  // Sync gamification data from backend on mount
  useEffect(() => {
    syncWithBackend();
  }, []);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const handleToggleTask = useCallback((task: Task) => {
    updateTask.mutate({ id: task.id, data: { status: task.status === 'completed' ? 'open' : 'completed' } });
  }, [updateTask]);

  const handleCompleteHabit = useCallback((habit: HabitWithLogs) => {
    const d = new Date().toISOString().split('T')[0];
    const log = habit.logs?.find((l) => l.date?.split('T')[0] === d);
    logHabit.mutate({ id: habit.id, data: { date: d, completed_count: (log?.completedCount ?? 0) + 1 } });
  }, [logHabit]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Logo + Bell */}
        <View className="mt-2 flex-row items-center gap-2.5">
          <Image
            source={require('../../../assets/images/tpw_logo_full-512x512.png')}
            className="h-8 w-8 rounded-lg"
            resizeMode="contain"
          />
          <Text className="flex-1 text-base font-bold text-foreground">The Prime Way</Text>
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            className="relative h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
          >
            <Icon as={Bell} size={20} className="text-foreground" />
            {notificationCount > 0 && (
              <View className="absolute right-0 top-0 h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-0.5">
                <Text className="text-[9px] font-bold text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Player Status — scrollable, not fixed */}
        <View className="mt-5">
          <PlayerStatusBar greeting={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`} />
        </View>

        {/* Daily Goal */}
        <View className="mt-6">
          <DailyGoalRing />
        </View>

        {/* Quick Actions — bigger icons */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="mt-8">
          <View className="flex-row justify-between">
            <QuickAction icon={Plus} label={t('quickActions.taskShort')} color="primary" onPress={() => setShowTaskForm(true)} />
            <QuickAction icon={Timer} label={t('quickActions.focusShort')} color="destructive" onPress={() => router.push('/(app)/pomodoro')} />
            <QuickAction icon={Wallet} label={t('quickActions.expenseShort')} color="success" onPress={() => setShowTransactionForm(true)} />
            <QuickAction icon={FileText} label={t('quickActions.noteShort')} color="accent" onPress={() => router.push('/(app)/notes/new' as never)} />
          </View>
        </Animated.View>

        {/* AI Briefing */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-8">
          <Pressable onPress={() => router.push('/(app)/ai')}>
            <Card className="border-primary/20">
              <CardContent className="flex-row items-start gap-3 py-4">
                <IconCircle icon={Sparkles} color="primary" size="md" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{t('dailyBrief')}</Text>
                  <Text className="mt-1.5 text-sm leading-5 text-muted-foreground">
                    {t('dailyBriefSummary', { tasks: todayTasks.length, completedHabits, totalHabits })}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Today's Tasks */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="mt-8">
          <SectionHeader title={t('sections.today')} actionLabel={t('seeAll')} onAction={() => router.push('/(app)/(tabs)/tasks/today')} />
          {todayTasks.length > 0 ? (
            <View className="mt-4 gap-3">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleTask}
                  onPress={() => setEditingTask(task)}
                  onTimer={() => setTimerTask(task)}
                  showTimeSlot
                />
              ))}
            </View>
          ) : (
            <Card className="mt-4">
              <CardContent className="items-center py-8">
                <Icon as={CheckSquare} size={36} className="text-muted-foreground/40" />
                <Text className="mt-3 text-sm text-muted-foreground">{t('noTasksToday')}</Text>
              </CardContent>
            </Card>
          )}
        </Animated.View>

        {/* Habits */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mt-8">
          <SectionHeader title={t('sections.habits')} actionLabel={t('seeAll')} onAction={() => router.push('/(app)/(tabs)/habits')} />
          {todayHabits.length > 0 ? (
            <View className="mt-4 gap-3">
              {todayHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} onComplete={() => handleCompleteHabit(habit)} onPress={() => router.push('/(app)/(tabs)/habits')} />
              ))}
            </View>
          ) : (
            <Card className="mt-4">
              <CardContent className="items-center py-8">
                <Icon as={Flame} size={36} className="text-muted-foreground/40" />
                <Text className="mt-3 text-sm text-muted-foreground">{t('noHabitsToday')}</Text>
              </CardContent>
            </Card>
          )}
        </Animated.View>
      </ScrollView>

      {/* Sheets */}
      <TaskFormSheet isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} />
      <TransactionFormSheet isOpen={showTransactionForm} onClose={() => setShowTransactionForm(false)} />
      <TaskEditSheet task={editingTask} isOpen={!!editingTask} onClose={() => setEditingTask(null)} />
      <TaskTimerSheet task={timerTask} isOpen={!!timerTask} onClose={() => setTimerTask(null)} />
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: typeof Plus; label: string; color: 'primary' | 'destructive' | 'success' | 'accent'; onPress: () => void }) {
  return (
    <Pressable className="items-center gap-2.5" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>
      <IconCircle icon={icon} color={color} size="lg" />
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
    </Pressable>
  );
}
