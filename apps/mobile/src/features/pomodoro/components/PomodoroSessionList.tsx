import { View, FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Timer } from 'lucide-react-native';
import { usePomodoroSessions } from '../hooks/usePomodoro';
import type { PomodoroSession } from '@shared/types/models';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function SessionRow({ session }: { session: PomodoroSession }) {
  const minutes = session.actualDuration ?? session.plannedDuration ?? 0;
  const dateLabel = session.startedAt
    ? new Date(session.startedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
        <Icon as={Timer} size={16} className="text-foreground" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">
          {session.sessionType === 'focus' ? 'Focus' : 'Break'}
        </Text>
        <Text className="text-xs text-muted-foreground">{dateLabel}</Text>
      </View>
      <Text className="text-sm font-semibold text-foreground">
        {formatDuration(minutes)}
      </Text>
    </View>
  );
}

export function PomodoroSessionList() {
  const { data, isLoading } = usePomodoroSessions();
  if (isLoading) return <LoadingOverlay />;
  const sessions = data ?? [];
  if (sessions.length === 0) {
    return <EmptyState title="No sessions yet" />;
  }
  return (
    <FlatList
      data={sessions}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => <SessionRow session={item} />}
    />
  );
}
