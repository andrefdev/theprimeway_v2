import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Text } from '@/shared/components/ui/text';
import { Progress } from '@/shared/components/ui/progress';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import { TaskTimerSheet } from '@/features/tasks/components/TaskTimerSheet';
import { useTasks, useUpdateTask } from '@/features/tasks/hooks/useTasks';
import { CheckSquare, AlertTriangle } from 'lucide-react-native';
import { format } from 'date-fns';
import type { Task } from '@shared/types/models';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { loadTaskOrder, saveTaskOrder, applyTaskOrder } from '@/features/tasks/services/localTaskOrder';

export default function TodayScreen() {
  const { t } = useTranslation('features.tasks');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timerTask, setTimerTask] = useState<Task | null>(null);
  const [order, setOrder] = useState<string[]>([]);

  const { data: tasks, isLoading, isError, refetch } = useTasks({ date: todayStr });
  const updateTask = useUpdateTask();

  useEffect(() => {
    loadTaskOrder(todayStr).then(setOrder);
  }, [todayStr]);

  const sortedTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    const ordered = applyTaskOrder(tasks, order);
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return ordered.slice().sort((a, b) => {
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
      if (order.length) {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        if (ai !== -1 || bi !== -1) {
          return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
        }
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, order]);

  const total = sortedTasks.length;
  const completedCount = useMemo(
    () => sortedTasks.filter((t) => t.status === 'completed').length,
    [sortedTasks]
  );
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const handleToggleComplete = useCallback(
    (task: Task) => {
      updateTask.mutate({
        id: task.id,
        data: { status: task.status === 'completed' ? 'open' : 'completed' },
      });
    },
    [updateTask]
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: Task[] }) => {
      const ids = data.map((t) => t.id);
      setOrder(ids);
      saveTaskOrder(todayStr, ids).catch(() => {});
    },
    [todayStr]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => (
      <ScaleDecorator>
        <View style={{ opacity: isActive ? 0.9 : 1, marginBottom: 8 }}>
          <TaskCard
            task={item}
            onToggleComplete={handleToggleComplete}
            onPress={() => setEditingTask(item)}
            onTimer={() => setTimerTask(item)}
            onLongPress={drag}
            showTimeSlot
          />
        </View>
      </ScaleDecorator>
    ),
    [handleToggleComplete]
  );

  if (isLoading) return <LoadingOverlay message={t('loading')} />;

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t('errorLoadingTitle')}
        description={t('errorLoadingDescription')}
        actionLabel={t('actions.start')}
        onAction={() => refetch()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {total > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} className="px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">
              {t('completedCount', { completed: completedCount, total })}
            </Text>
            <Text className="text-sm font-bold text-primary">{progressPercent}%</Text>
          </View>
          <Progress value={progressPercent} className="mt-2 h-2" indicatorClassName="bg-primary" />
          <Text className="mt-1 text-2xs text-muted-foreground">Long-press a task to reorder</Text>
        </Animated.View>
      )}

      <DraggableFlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        ListEmptyComponent={
          <EmptyState
            icon={CheckSquare}
            title={t('noTasksForToday')}
            description={t('addTaskDescription')}
          />
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 4 }}
      />

      <TaskEditSheet task={editingTask} isOpen={!!editingTask} onClose={() => setEditingTask(null)} />
      <TaskTimerSheet task={timerTask} isOpen={!!timerTask} onClose={() => setTimerTask(null)} />
    </View>
  );
}
