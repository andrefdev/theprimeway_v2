import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { Edit2, Calendar, Clock, Target } from 'lucide-react-native';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { useTaskById } from '@/features/tasks/hooks/useTasks';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import { SubtaskList } from '@/features/tasks/components/SubtaskList';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/cn';

const PRIORITY_BG: Record<string, string> = {
  low: 'bg-priority-low',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const { data: task, isLoading, isError, refetch } = useTaskById(id!);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Task" showBack />
      {isLoading ? (
        <LoadingOverlay />
      ) : isError || !task ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-4">
          <View>
            <View className="mb-2 flex-row items-center gap-2">
              <View className={cn('h-2 w-2 rounded-full', PRIORITY_BG[task.priority] ?? 'bg-muted')} />
              <Text className="text-2xs font-semibold uppercase text-muted-foreground">
                {task.priority}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{task.title}</Text>
            {task.description ? (
              <Text className="mt-2 text-sm text-muted-foreground">{task.description}</Text>
            ) : null}
          </View>

          <View className="gap-2 rounded-xl border border-border bg-card p-4">
            {task.scheduledDate ? (
              <View className="flex-row items-center gap-2">
                <Icon as={Calendar} size={14} className="text-muted-foreground" />
                <Text className="text-sm text-foreground">
                  {format(new Date(task.scheduledDate), 'PPP')}
                </Text>
              </View>
            ) : null}
            {task.estimatedDurationMinutes ? (
              <View className="flex-row items-center gap-2">
                <Icon as={Clock} size={14} className="text-muted-foreground" />
                <Text className="text-sm text-foreground">
                  {task.estimatedDurationMinutes} min
                </Text>
              </View>
            ) : null}
            {(task as any).goalId ? (
              <View className="flex-row items-center gap-2">
                <Icon as={Target} size={14} className="text-muted-foreground" />
                <Text className="text-sm text-foreground">Linked to goal</Text>
              </View>
            ) : null}
          </View>

          <SubtaskList taskId={task.id} />

          <Button onPress={() => setEditOpen(true)} className="flex-row items-center gap-2">
            <Icon as={Edit2} size={14} className="text-primary-foreground" />
            <Text className="text-sm font-semibold text-primary-foreground">Edit</Text>
          </Button>
        </ScrollView>
      )}

      <TaskEditSheet
        task={task ?? null}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </SafeAreaView>
  );
}
