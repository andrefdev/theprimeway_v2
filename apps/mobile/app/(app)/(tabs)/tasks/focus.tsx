import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import { useTasks, useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTasks';
import { Focus, Flame } from 'lucide-react-native';
import type { Task } from '@shared/types/models';
import { useTranslation } from '@/shared/hooks/useTranslation';

export default function FocusScreen() {
  const { t } = useTranslation('features.tasks');
  const { data: tasks, isLoading, refetch } = useTasks({ priority: 'high', status: 'open' });
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const focusTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.slice()
      .filter((t) => t.priority === 'high' && t.status === 'open')
      .sort((a, b) => {
        // Tasks with due dates first
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return 0;
      });
  }, [tasks]);

  const handleToggleComplete = useCallback(
    (task: Task) => {
      updateTask.mutate({
        id: task.id,
        data: { status: 'completed' },
      });
    },
    [updateTask]
  );

  const handlePress = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleDelete = useCallback(
    (task: Task) => {
      deleteTask.mutate(task.id);
    },
    [deleteTask]
  );

  if (isLoading) {
    return <LoadingOverlay message={t('loadingFocus')} />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Focus Header */}
      {focusTasks.length > 0 && (
        <View className="flex-row items-center gap-2 px-4 py-3">
          <Icon as={Flame} size={18} className="text-red-500" />
          <Text className="text-sm font-medium text-foreground">
            {focusTasks.length !== 1
              ? t('focusHeaderPlural', { count: focusTasks.length })
              : t('focusHeader', { count: focusTasks.length })}
          </Text>
        </View>
      )}

      {/* Task List */}
      <FlatList
        data={focusTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={handleToggleComplete}
            onPress={handlePress}
            
          />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        ListEmptyComponent={
          <EmptyState
            icon={Focus}
            title={t('allClear')}
            description={t('allClearDescription')}
          />
        }
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerClassName="px-4 pb-20"
      />
      <TaskEditSheet task={editingTask} isOpen={!!editingTask} onClose={() => setEditingTask(null)} />
    </View>
  );
}
