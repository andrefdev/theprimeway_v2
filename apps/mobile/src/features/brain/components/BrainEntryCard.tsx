import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Pin, Loader, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import type { BrainEntry } from '@repo/shared/types';
import { cn } from '@/shared/utils/cn';

const STATUS_META: Record<
  BrainEntry['status'],
  { icon: any; tone: string; label: string }
> = {
  pending: { icon: Loader, tone: 'text-muted-foreground', label: 'Pending' },
  transcribing: { icon: Loader, tone: 'text-muted-foreground', label: 'Transcribing' },
  analyzing: { icon: Loader, tone: 'text-primary', label: 'Analyzing' },
  complete: { icon: CheckCircle2, tone: 'text-emerald-500', label: 'Ready' },
  failed: { icon: AlertCircle, tone: 'text-destructive', label: 'Failed' },
};

interface Props {
  entry: BrainEntry;
  onPress: (entry: BrainEntry) => void;
}

export function BrainEntryCard({ entry, onPress }: Props) {
  const status = STATUS_META[entry.status];
  const title =
    entry.userTitle ||
    entry.title ||
    (entry.rawTranscript ? entry.rawTranscript.slice(0, 80) : 'Untitled');
  const preview = entry.summary || entry.rawTranscript || '';

  return (
    <Pressable
      onPress={() => onPress(entry)}
      className="mb-2 rounded-xl border border-border bg-card p-4 active:opacity-70"
    >
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Icon as={status.icon} size={12} className={status.tone} />
          <Text className={cn('text-2xs font-medium uppercase', status.tone)}>
            {status.label}
          </Text>
        </View>
        {entry.isPinned ? (
          <Icon as={Pin} size={12} className="text-amber-500" />
        ) : null}
      </View>
      <Text
        numberOfLines={2}
        className="text-sm font-semibold text-foreground"
      >
        {title}
      </Text>
      {preview ? (
        <Text
          numberOfLines={2}
          className="mt-1 text-xs text-muted-foreground"
        >
          {preview}
        </Text>
      ) : null}
      {entry.topics.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {entry.topics.slice(0, 4).map((t) => (
            <View key={t} className="rounded-full bg-muted px-2 py-0.5">
              <Text className="text-2xs text-muted-foreground">{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
