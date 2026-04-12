import { useCallback, useMemo, useState } from 'react';
import { View, TextInput } from 'react-native';
import { FlatList } from 'react-native';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import { useTasks, useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTasks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/utils/cn';
import { List, Search, Filter, X } from 'lucide-react-native';
import type { Task, TaskPriority } from '@shared/types/models';
import { useTranslation } from '@/shared/hooks/useTranslation';

// ============================================================
// FILTER OPTIONS
// ============================================================

type StatusFilter = 'all' | 'open' | 'completed';
type PriorityFilter = 'all' | TaskPriority;

// ============================================================
// SCREEN
// ============================================================

export default function AllTasksScreen() {
  const { t } = useTranslation('features.tasks');

  const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('filterAll') },
    { value: 'open', label: t('status.open') },
    { value: 'completed', label: t('status.done') },
  ];

  const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: t('filterAll') },
    { value: 'high', label: t('priority.high') },
    { value: 'medium', label: t('priority.med') },
    { value: 'low', label: t('priority.low') },
  ];
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);

  const { data: tasks, isLoading, refetch } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      // Search filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesTags = task.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTags) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, debouncedSearch, statusFilter, priorityFilter]);

  const handleToggleComplete = useCallback(
    (task: Task) => {
      updateTask.mutate({
        id: task.id,
        data: { status: task.status === 'completed' ? 'open' : 'completed' },
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

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  if (isLoading) {
    return <LoadingOverlay message={t('loading')} />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Search Bar */}
      <View className="flex-row items-center gap-2 px-4 py-3">
        <View className="flex-1 flex-row items-center gap-2 rounded-md border border-input bg-background px-3">
          <Icon as={Search} size={16} className="text-muted-foreground" />
          <TextInput
            className="h-10 flex-1 text-base text-foreground"
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="hsl(0 0% 63.9%)"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Icon as={X} size={16} className="text-muted-foreground" />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          className={cn(
            'h-10 w-10 items-center justify-center rounded-md border border-input',
            hasActiveFilters && 'border-primary bg-primary/10'
          )}
        >
          <Icon
            as={Filter}
            size={18}
            className={cn(hasActiveFilters ? 'text-primary' : 'text-muted-foreground')}
          />
        </Pressable>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className="gap-3 border-b border-border px-4 pb-3">
          {/* Status */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted-foreground">{t('labels.status')}</Text>
            <View className="flex-row gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setStatusFilter(opt.value)}
                  className={cn(
                    'rounded-full border border-input px-3 py-1',
                    statusFilter === opt.value && 'border-primary bg-primary'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-medium',
                      statusFilter === opt.value
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Priority */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted-foreground">{t('labels.priority')}</Text>
            <View className="flex-row gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setPriorityFilter(opt.value)}
                  className={cn(
                    'rounded-full border border-input px-3 py-1',
                    priorityFilter === opt.value && 'border-primary bg-primary'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-medium',
                      priorityFilter === opt.value
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Results Count */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-xs text-muted-foreground">
          {filteredTasks.length === 1 ? t('taskCount', { count: filteredTasks.length }) : t('taskCountPlural', { count: filteredTasks.length })}
        </Text>
        {hasActiveFilters && (
          <Pressable
            onPress={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
          >
            <Text className="text-xs font-medium text-primary">{t('clearFilters')}</Text>
          </Pressable>
        )}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={handleToggleComplete}
            onPress={handlePress}
            
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon={List}
            title={debouncedSearch ? t('noMatchingTasks') : t('noTasksYet')}
            description={
              debouncedSearch
                ? t('noMatchingTasksDescription')
                : t('noTasksYetDescription')
            }
            actionLabel={debouncedSearch ? undefined : t('newTask')}
            onAction={
              debouncedSearch
                ? undefined
                : () => router.push('/(app)/(tabs)/tasks/new' as never)
            }
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
