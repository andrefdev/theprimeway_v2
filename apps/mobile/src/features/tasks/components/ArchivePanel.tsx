import { View, FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Archive, RotateCcw } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { toast } from '@/shared/lib/toast';
import { format } from 'date-fns';

export function ArchivePanel() {
  const { data: completed, isLoading } = useTasks({ status: 'completed' });
  const update = useUpdateTask();

  if (isLoading) return <LoadingOverlay />;

  const items = completed ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="Archive empty"
        description="Completed tasks appear here"
      />
    );
  }

  const restore = (id: string) =>
    update.mutate(
      { id, data: { status: 'pending' } as any },
      { onSuccess: () => toast.success('Restored') }
    );

  return (
    <FlatList
      data={items}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      renderItem={({ item }) => (
        <View className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
          <Icon as={Archive} size={14} className="text-muted-foreground" />
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-sm font-medium text-foreground line-through"
            >
              {item.title}
            </Text>
            {item.completedAt ? (
              <Text className="text-2xs text-muted-foreground">
                {format(new Date(item.completedAt), 'PP')}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => restore(item.id)}
            className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1"
          >
            <Icon as={RotateCcw} size={10} className="text-foreground" />
            <Text className="text-2xs font-semibold text-foreground">Restore</Text>
          </Pressable>
        </View>
      )}
    />
  );
}
