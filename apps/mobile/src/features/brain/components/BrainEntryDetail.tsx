import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import {
  RefreshCw,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  CheckSquare,
} from 'lucide-react-native';
import {
  useBrainEntry,
  useReprocessBrainEntry,
  useUpdateBrainEntry,
  useDeleteBrainEntry,
  useApplyActionItem,
} from '../hooks/useBrain';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { toast } from '@/shared/lib/toast';
import { cn } from '@/shared/utils/cn';

interface Props {
  entryId: string;
  onDeleted?: () => void;
}

export function BrainEntryDetail({ entryId, onDeleted }: Props) {
  const { data: entry, isLoading, isError, refetch } = useBrainEntry(entryId);
  const update = useUpdateBrainEntry(entryId);
  const reprocess = useReprocessBrainEntry();
  const remove = useDeleteBrainEntry();
  const apply = useApplyActionItem(entryId);

  if (isLoading) return <LoadingOverlay />;
  if (isError || !entry) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const togglePin = () =>
    update.mutate({ isPinned: !entry.isPinned });
  const toggleArchive = () =>
    update.mutate({ isArchived: !entry.isArchived });
  const handleReprocess = () =>
    reprocess.mutate(entry.id, {
      onSuccess: () => toast.success('Reprocessing'),
    });
  const handleDelete = () =>
    remove.mutate(entry.id, {
      onSuccess: () => {
        toast.success('Deleted');
        onDeleted?.();
      },
    });
  const handleApply = (index: number) =>
    apply.mutate(index, {
      onSuccess: (res) => toast.success(`Task created: ${res.task.title}`),
    });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <View className="mb-4 flex-row flex-wrap gap-2">
          <ActionButton
            icon={entry.isPinned ? PinOff : Pin}
            label={entry.isPinned ? 'Unpin' : 'Pin'}
            onPress={togglePin}
          />
          <ActionButton
            icon={entry.isArchived ? ArchiveRestore : Archive}
            label={entry.isArchived ? 'Unarchive' : 'Archive'}
            onPress={toggleArchive}
          />
          <ActionButton
            icon={RefreshCw}
            label="Reprocess"
            onPress={handleReprocess}
            loading={reprocess.isPending}
          />
          <ActionButton
            icon={Trash2}
            label="Delete"
            onPress={handleDelete}
            destructive
          />
        </View>

        {entry.userTitle || entry.title ? (
          <Text className="mb-2 text-xl font-bold text-foreground">
            {entry.userTitle || entry.title}
          </Text>
        ) : null}

        {entry.summary ? (
          <Text className="mb-4 text-sm text-muted-foreground">
            {entry.summary}
          </Text>
        ) : null}

        {entry.rawTranscript ? (
          <View className="mb-4 rounded-xl border border-border bg-card p-3">
            <Text className="mb-1 text-2xs font-semibold uppercase text-muted-foreground">
              Original
            </Text>
            <Text className="text-sm text-foreground">{entry.rawTranscript}</Text>
          </View>
        ) : null}

        {entry.topics.length > 0 ? (
          <View className="mb-4 flex-row flex-wrap gap-1">
            {entry.topics.map((t) => (
              <View key={t} className="rounded-full bg-muted px-2 py-1">
                <Text className="text-2xs text-muted-foreground">{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {entry.actionItems.length > 0 ? (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-foreground">
              Action items
            </Text>
            {entry.actionItems.map((item, index) => (
              <View
                key={`${item.title}-${index}`}
                className="mb-2 flex-row items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleApply(index)}
                  disabled={!!item.appliedTaskId || apply.isPending}
                  className={cn(
                    'flex-row items-center gap-1 rounded-full px-3 py-1.5',
                    item.appliedTaskId ? 'bg-muted' : 'bg-primary'
                  )}
                >
                  <Icon
                    as={CheckSquare}
                    size={12}
                    className={
                      item.appliedTaskId
                        ? 'text-muted-foreground'
                        : 'text-primary-foreground'
                    }
                  />
                  <Text
                    className={cn(
                      'text-2xs font-semibold',
                      item.appliedTaskId
                        ? 'text-muted-foreground'
                        : 'text-primary-foreground'
                    )}
                  >
                    {item.appliedTaskId ? 'Created' : 'Create task'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {entry.errorMessage ? (
          <View className="mb-4 rounded-xl border border-destructive bg-destructive/10 p-3">
            <Text className="text-sm text-destructive">{entry.errorMessage}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  loading,
  destructive,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={cn(
        'flex-row items-center gap-1 rounded-full border px-3 py-1.5',
        destructive ? 'border-destructive' : 'border-border'
      )}
    >
      <Icon
        as={icon}
        size={12}
        className={destructive ? 'text-destructive' : 'text-foreground'}
      />
      <Text
        className={cn(
          'text-2xs font-medium',
          destructive ? 'text-destructive' : 'text-foreground'
        )}
      >
        {loading ? '…' : label}
      </Text>
    </Pressable>
  );
}
