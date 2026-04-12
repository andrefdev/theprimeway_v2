import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Progress } from '@/shared/components/ui/progress';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import { TaskTimerSheet } from '@/features/tasks/components/TaskTimerSheet';
import { useTasks, useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTasks';
import { CheckSquare, AlertTriangle } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Task } from '@shared/types/models';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TodayScreen() {
  const { t } = useTranslation('features.tasks');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timerTask, setTimerTask] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError, refetch } = useTasks({ date: todayStr });
  const updateTask = useUpdateTask();

  const sortedTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.slice().sort((a, b) => {
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  const total = sortedTasks.length;
  const completedCount = useMemo(() => sortedTasks.filter((t) => t.status === 'completed').length, [sortedTasks]);
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const handleToggleComplete = useCallback((task: Task) => {
    updateTask.mutate({ id: task.id, data: { status: task.status === 'completed' ? 'open' : 'completed' } });
  }, [updateTask]);

  if (isLoading) return <LoadingOverlay message={t('loading')} />;

  if (isError) {
    return <EmptyState icon={AlertTriangle} title={t('errorLoadingTitle')} description={t('errorLoadingDescription')} actionLabel={t('actions.start')} onAction={() => refetch()} />;
  }

  return (
    <View className="flex-1 bg-background">
      {total > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} className="px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">{t('completedCount', { completed: completedCount, total })}</Text>
            <Text className="text-sm font-bold text-primary">{progressPercent}%</Text>
          </View>
          <Progress value={progressPercent} className="mt-2 h-2" indicatorClassName="bg-primary" />
        </Animated.View>
      )}

      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={handleToggleComplete}
            onPress={() => setEditingTask(item)}
            onTimer={() => setTimerTask(item)}
            showTimeSlot
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState icon={CheckSquare} title={t('noTasksForToday')} description={t('addTaskDescription')} />
        }
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerClassName="px-4 pb-20 pt-1"
      />

      <TaskEditSheet task={editingTask} isOpen={!!editingTask} onClose={() => setEditingTask(null)} />
      <TaskTimerSheet task={timerTask} isOpen={!!timerTask} onClose={() => setTimerTask(null)} />
    </View>
  );
}
